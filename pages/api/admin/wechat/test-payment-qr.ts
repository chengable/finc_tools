import { requireAdmin, AuthenticatedRequest } from '../../../../lib/admin-middleware'
import { prisma } from '../../../../lib/prisma'
import { generateQRCodeDataURL } from '../../../../lib/wechat-pay'
import { NextApiResponse } from 'next'

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: '方法不允许' })
  }

  try {
    // 获取微信支付配置
    const paymentConfig = await prisma.wechatConfig.findUnique({
      where: { configType: 'payment' }
    })

    if (!paymentConfig || paymentConfig.status !== 'enabled') {
      return res.status(400).json({ 
        success: false, 
        message: '微信支付配置未启用或不存在' 
      })
    }

    if (!paymentConfig.merchantId || !paymentConfig.merchantKey) {
      return res.status(400).json({ 
        success: false, 
        message: '微信支付配置不完整，请先配置商户号和商户密钥' 
      })
    }

    // 生成测试订单号
    const outTradeNo = `TEST_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
    
    // 模拟微信支付统一下单参数
    const orderData = {
      merchantId: paymentConfig.merchantId,
      outTradeNo: outTradeNo,
      totalFee: 1, // 测试金额1分
      body: 'FINC AI财报分析平台-功能测试',
      spbillCreateIp: req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1',
      notifyUrl: paymentConfig.payCallbackUrl,
      tradeType: 'NATIVE', // 扫码支付
      productId: 'TEST_PRODUCT'
    }

    // 生成真实的微信支付测试订单
    // 使用实际的微信支付API创建测试订单
    try {
      // 导入微信支付创建函数
      const { createWechatPayOrder } = require('../../../../lib/wechat-pay')
      
      // 创建一个真实的测试订单（金额为1分）
      const testResult = await createWechatPayOrder({
        userId: 'TEST_ADMIN_USER', // 测试用户ID
        paymentType: '1_month',
        amount: 1, // 1分钱
        body: 'FINC AI财报分析平台-管理员功能测试',
        clientIp: req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1'
      })
      
      if (!testResult.success) {
        return res.status(500).json({
          success: false,
          message: '创建测试订单失败: ' + testResult.message
        })
      }
      
      const codeUrl = testResult.qrCode
      const testQrCodeImage = testResult.qrCodeImage
    
    const qrCodeData = {
        outTradeNo: testResult.orderId, // 使用实际创建的订单号（数据库中的订单号）
        codeUrl: codeUrl, // 微信支付链接
      expireTime: new Date(Date.now() + 30 * 60 * 1000), // 30分钟过期
      totalFee: 1,
      body: orderData.body,
        // 使用本地生成的二维码图片
        qrCodeImage: testQrCodeImage, // Base64编码的二维码图片数据
      // 说明信息
        note: '这是真实的测试订单二维码，可以扫码测试支付流程'
    }

    res.status(200).json({ 
      success: true, 
      data: qrCodeData,
      message: '测试支付二维码生成成功'
    })
      
    } catch (createError) {
      console.error('创建真实测试订单失败:', createError)
      
      // 如果创建真实订单失败，回退到模拟订单
      const codeUrl = `weixin://wxpay/bizpayurl?pr=${Math.random().toString(36).substring(2, 15)}`
      const fallbackQrCodeImage = await generateQRCodeDataURL(codeUrl)
      
      const qrCodeData = {
        outTradeNo: outTradeNo,
        codeUrl: codeUrl,
        expireTime: new Date(Date.now() + 30 * 60 * 1000),
        totalFee: 1,
        body: orderData.body,
        qrCodeImage: fallbackQrCodeImage,
        note: '模拟测试二维码（真实订单创建失败）'
      }
      
      res.status(200).json({ 
        success: true, 
        data: qrCodeData,
        message: '测试支付二维码生成成功（模拟模式）'
      })
    }

  } catch (error) {
    console.error('生成微信支付测试二维码失败:', error)
    res.status(500).json({ 
      success: false, 
      message: '生成测试二维码失败' 
    })
  }
}

export default requireAdmin(handler) 