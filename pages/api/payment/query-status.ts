import { NextApiRequest, NextApiResponse } from 'next'
import { verifyToken } from '../../../lib/auth'
import { queryWechatPayOrder } from '../../../lib/wechat-pay'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
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

    const { orderId, orderNo } = req.query

    if ((!orderId && !orderNo) || (orderId && typeof orderId !== 'string') || (orderNo && typeof orderNo !== 'string')) {
      return res.status(400).json({ success: false, message: '订单ID或订单号无效' })
    }

    // 查找订单 - 支持按ID或订单号查询
    let order
    if (orderId) {
      order = await prisma.paymentOrder.findUnique({
      where: { id: orderId },
      include: { user: true }
    })
    } else if (orderNo) {
      order = await prisma.paymentOrder.findUnique({
        where: { orderNo: orderNo },
        include: { user: true }
      })
    }

    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' })
    }

    // 验证订单所有者
    if (order.userId !== decoded.userId && decoded.userType !== 'admin') {
      return res.status(403).json({ success: false, message: '无权限查看此订单' })
    }

    // 如果订单已经是终态，直接返回状态
    if (['paid', 'failed', 'expired'].includes(order.status)) {
      return res.status(200).json({
        success: true,
        data: {
          orderId: order.id,
          status: order.status,
          paidTime: order.paidTime,
          amount: order.amount,
          paymentType: order.paymentType
        }
      })
    }

    // 检查二维码是否过期
    if (order.qrExpireTime && new Date() > order.qrExpireTime) {
      // 更新订单状态为过期
      await prisma.paymentOrder.update({
        where: { id: order.id },
        data: { status: 'expired' }
      })

      return res.status(200).json({
        success: true,
        data: {
          orderId: order.id,
          status: 'expired',
          needRefresh: true
        }
      })
    }

    // 查询微信支付状态
    const result = await queryWechatPayOrder(order.orderNo)

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.message || '查询支付状态失败'
      })
    }

    // 从微信返回的数据中提取状态
    const tradeState = result.data?.trade_state
    let paymentStatus = order.status // 默认保持原状态
    
    // 将微信支付状态转换为我们的状态
    if (tradeState === 'SUCCESS') {
      paymentStatus = 'paid'
    } else if (tradeState === 'PAYERROR' || tradeState === 'REVOKED') {
      paymentStatus = 'failed'
    } else if (tradeState === 'CLOSED') {
      paymentStatus = 'expired'
    }

    // 更新本地订单状态
    if (paymentStatus !== order.status) {
      await prisma.paymentOrder.update({
        where: { id: order.id },
        data: { status: paymentStatus }
      })

      // 如果支付成功，更新用户权限
      if (paymentStatus === 'paid') {
        let monthsToAdd = 1 // 默认1个月
        
        // 根据支付类型确定会员时长
        switch (order.paymentType) {
          case '1_month':
            monthsToAdd = 1
            break
          case '3_month':
            monthsToAdd = 3
            break
          case '6_month':
            monthsToAdd = 6
            break
          case '12_month':
            monthsToAdd = 12
            break
          default:
            monthsToAdd = 1
        }
        
        // 计算新的过期时间：如果用户已有有效期，从有效期开始计算，否则从当前时间开始
        const expireTime = new Date()
        const currentUser = order.user
        
        if (currentUser.expireTime && currentUser.expireTime > new Date()) {
          // 用户还有有效会员期，从到期时间开始叠加
          expireTime.setTime(currentUser.expireTime.getTime())
          console.log(`用户 ${currentUser.username} 续费：从现有到期时间 ${currentUser.expireTime.toISOString()} 开始叠加 ${monthsToAdd} 个月`)
        } else {
          // 用户会员已过期或为新用户，从当前时间开始计算
          console.log(`用户 ${currentUser.username} 新购/重新激活：从当前时间开始计算 ${monthsToAdd} 个月`)
        }
        
        expireTime.setMonth(expireTime.getMonth() + monthsToAdd)

        await prisma.user.update({
          where: { id: order.userId },
          data: {
            userType: 'premium',
            paymentType: order.paymentType,
            expireTime
          }
        })
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        orderId: order.id,
        status: paymentStatus,
        amount: order.amount,
        paymentType: order.paymentType,
        paidTime: paymentStatus === 'paid' ? new Date() : null
      }
    })

  } catch (error) {
    console.error('查询支付状态API错误:', error)
    return res.status(500).json({ success: false, message: '服务器内部错误' })
  }
} 