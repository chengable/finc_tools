import { NextApiRequest, NextApiResponse } from 'next'
import { verifyToken } from '../../../lib/auth'
import { createWechatPayOrder } from '../../../lib/wechat-pay'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: '请求方法不支持' })
  }

  try {
    // 验证用户身份
    const token = req.cookies.jwt_token || req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return res.status(401).json({ success: false, message: '请先登录' })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return res.status(401).json({ success: false, message: '登录状态已过期' })
    }

    // 检查用户权限（仅免费版用户可以访问，管理员不能创建支付订单）
    if (decoded.userType === 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: '管理员账户不能创建支付订单，请使用普通用户账户' 
      })
    }

    // 普通用户
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    })

    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' })
    }

    // // 权限检查：仅免费版用户可访问
    // if (user.userType !== 'free') {
    //   return res.status(403).json({ success: false, message: '您已是专家版用户' })
    // }

    const { paymentType } = req.body

    // 验证支付类型
    if (!paymentType || !['1_month', '3_month', '6_month', '12_month'].includes(paymentType)) {
      return res.status(400).json({ success: false, message: '支付类型无效' })
    }

    // 确定金额和描述
    let amount: number
    let body: string

    switch (paymentType) {
      case '1_month':
        amount = 1200 // 12元
        body = 'FINC AI财报分析-1个月专家版'
        break
      case '3_month':
        amount = 3000 // 30元
        body = 'FINC AI财报分析-3个月专家版'
        break
      case '6_month':
        amount = 6000 // 60元
        body = 'FINC AI财报分析-6个月专家版'
        break
      case '12_month':
        amount = 10000 // 100元
        body = 'FINC AI财报分析-12个月专家版'
        break
      default:
        return res.status(400).json({ success: false, message: '支付类型无效' })
    }

    // 获取客户端IP
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
                     req.headers['x-real-ip'] as string || 
                     req.connection.remoteAddress || 
                     '127.0.0.1'

    // 创建支付订单
    const orderUserId = user.id
    
    const result = await createWechatPayOrder({
      userId: orderUserId,
      paymentType,
      amount,
      body,
      clientIp
    })

    if (!result.success) {
      return res.status(500).json({ 
        success: false, 
        message: result.message || '创建支付订单失败' 
      })
    }

    return res.status(200).json({
      success: true,
      data: {
        orderId: result.orderId,
        qrCode: result.qrCode,
        qrCodeImage: result.qrCodeImage,
        amount,
        paymentType,
        description: body
      }
    })

  } catch (error) {
    console.error('创建支付订单API错误:', error)
    return res.status(500).json({ success: false, message: '服务器内部错误' })
  }
} 