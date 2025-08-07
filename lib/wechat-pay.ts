import { Wechatpay } from 'wechatpay-axios-plugin'
import { readFileSync } from 'fs'
import QRCode from 'qrcode'
import { prisma } from './prisma'

// 微信支付相关配置
interface WechatPayConfig {
  appId: string
  merchantId: string
  merchantKey: string
  callbackUrl: string
  merchantCertificateSerial: string
  platformCertificateSerial: string  // 平台证书序列号
  platformCertificatePath: string    // 平台证书路径
  merchantCertPath: string
  merchantKeyPath: string
}

// 微信支付客户端实例
let wechatPayClient: any = null

// 初始化微信支付客户端
function initWechatPayClient(config: WechatPayConfig) {
  if (wechatPayClient) {
    return wechatPayClient
  }

  try {
    wechatPayClient = new Wechatpay({
      mchid: config.merchantId,
      serial: config.merchantCertificateSerial,
      privateKey: `file://${config.merchantKeyPath}`,
      certs: {
        [config.platformCertificateSerial]: `file://${config.platformCertificatePath}`,
      },
      // APIv2密钥（兼容老版本）
      secret: config.merchantKey,
      // 商户证书配置
      merchant: {
        cert: readFileSync(config.merchantCertPath),
        key: readFileSync(config.merchantKeyPath),
      },
    })
    
    return wechatPayClient
  } catch (error) {
    console.error('初始化微信支付客户端失败:', error)
    throw new Error('微信支付配置错误')
  }
}

// 获取微信支付配置
export async function getWechatPayConfig(): Promise<WechatPayConfig | null> {
  const config = await prisma.wechatConfig.findUnique({
    where: { configType: 'payment' }
  })
  
  if (!config || config.status !== 'enabled') {
    return null
  }
  
  // 微信支付APP_ID优先使用数据库配置，其次使用环境变量
  const appId = config.appId || process.env.WECHAT_PAY_APP_ID || ''
  const merchantId = config.merchantId || process.env.WECHAT_PAY_MERCHANT_ID || ''
  const merchantKey = config.merchantKey || process.env.WECHAT_PAY_API_KEY || ''
  const callbackUrl = config.payCallbackUrl || process.env.WECHAT_PAY_NOTIFY_URL || ''
  
  // 获取环境变量中的V3配置
  const merchantCertificateSerial = process.env.WECHAT_PAY_MERCHANT_CERTIFICATE_SERIAL || ''
  const platformCertificateSerial = process.env.WECHAT_PAY_PLATFORM_PUBLIC_KEY_ID || ''  // 复用现有环境变量
  const platformCertificatePath = process.env.WECHAT_PAY_PLATFORM_PUBLIC_KEY_PATH || ''   // 复用现有环境变量
  const merchantCertPath = process.env.WECHAT_PAY_CERT_PATH || ''
  const merchantKeyPath = process.env.WECHAT_PAY_KEY_PATH || ''
  
  return {
    appId,
    merchantId,
    merchantKey,
    callbackUrl,
    merchantCertificateSerial,
    platformCertificateSerial,
    platformCertificatePath,
    merchantCertPath,
    merchantKeyPath
  }
}

// 验证微信支付配置
export function validateWechatPayConfig(config: WechatPayConfig): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (!config.appId) errors.push('缺少微信应用ID')
  if (!config.merchantId) errors.push('缺少商户号')
  if (!config.merchantKey) errors.push('缺少商户密钥')
  if (!config.callbackUrl) errors.push('缺少回调地址')
  if (!config.merchantCertificateSerial) errors.push('缺少商户证书序列号')
  if (!config.platformCertificateSerial) errors.push('缺少平台证书序列号')
  if (!config.platformCertificatePath) errors.push('缺少平台证书路径')
  if (!config.merchantCertPath) errors.push('缺少商户证书路径')
  if (!config.merchantKeyPath) errors.push('缺少商户私钥路径')
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// 生成随机字符串
export function generateNonceStr(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// 生成订单号（只使用小写字母、数字和下划线）
export function generateOrderNo(): string {
  const timestamp = Date.now().toString()
  const random = Math.random().toString(36).substring(2, 8).toLowerCase()
  return `pay_${timestamp}_${random}`
}

// 生成二维码图片数据URL
export async function generateQRCodeDataURL(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
  } catch (error) {
    console.error('生成二维码失败:', error)
    throw new Error('二维码生成失败')
  }
}

// 创建微信支付统一下单（使用APIv3）
export async function createWechatPayOrder(params: {
  userId: string
  paymentType: '1_month' | '3_month' | '6_month' | '12_month'
  amount: number // 金额（分）
  body: string // 商品描述
  clientIp: string
}): Promise<{
  success: boolean
  orderId?: string
  qrCode?: string
  qrCodeImage?: string
  message?: string
}> {
  try {
    const config = await getWechatPayConfig()
    if (!config) {
      return { success: false, message: '微信支付配置未启用' }
    }
    
    // 验证配置完整性
    const validation = validateWechatPayConfig(config)
    if (!validation.isValid) {
      console.error('微信支付配置验证失败:', validation.errors)
      return { 
        success: false, 
        message: '微信支付配置不完整：' + validation.errors.join('；') 
      }
    }
    
    // 初始化微信支付客户端
    const wxpay = initWechatPayClient(config)
    
    const orderNo = generateOrderNo()
    
    // 构建Native下单参数（APIv3）
    const unifiedOrderParams = {
      mchid: config.merchantId,
      out_trade_no: orderNo,
      appid: config.appId,
      description: params.body,
      notify_url: config.callbackUrl,
      amount: {
        total: params.amount,
        currency: 'CNY'
      },
    }
    
    // 调用微信Native下单API（APIv3）
    const response = await wxpay.v3.pay.transactions.native.post(unifiedOrderParams)
    
    const { code_url } = response.data
    
    if (!code_url) {
      return { success: false, message: '获取支付二维码失败' }
    }
    
    // 生成二维码图片
    const qrCodeImage = await generateQRCodeDataURL(code_url)
    
    // 对于测试用户，创建一个特殊的订单记录用于测试
    if (params.userId === 'TEST_ADMIN_USER') {
      try {
        // 为测试用户创建一个真实用户的订单记录
        // 首先查找一个真实的用户来关联这个测试订单
        const realUser = await prisma.user.findFirst({
          where: { userType: 'free' },
          orderBy: { createdAt: 'desc' }
        })
        
        if (realUser) {
          const testOrder = await prisma.paymentOrder.create({
            data: {
              userId: realUser.id, // 使用真实用户ID
              orderNo,
              paymentType: params.paymentType,
              amount: params.amount,
              qrCode: code_url,
              qrExpireTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
              expireTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
              status: 'pending'
            }
          })
          
          console.log('为测试创建了真实订单记录:', {
            orderId: testOrder.id,
            orderNo: testOrder.orderNo,
            userId: testOrder.userId
          })
        }
      } catch (error) {
        console.error('创建测试订单记录失败:', error)
        // 即使创建失败也继续返回结果
      }
      
      return {
        success: true,
        orderId: orderNo, // 返回真实的订单号
        qrCode: code_url,
        qrCodeImage
      }
    }
    
    // 创建订单记录
    const order = await prisma.paymentOrder.create({
      data: {
        userId: params.userId,
        orderNo,
        paymentType: params.paymentType,
        amount: params.amount,
        qrCode: code_url,
        qrExpireTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2小时后过期
        expireTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24小时后过期
        status: 'pending'
      }
    })
    
    return {
      success: true,
      orderId: order.id,
      qrCode: code_url,
      qrCodeImage
    }
    
  } catch (error) {
    console.error('创建微信支付订单失败:', error)
    return { success: false, message: '系统错误，请稍后重试' }
  }
}

// 查询微信支付订单状态
export async function queryWechatPayOrder(orderNo: string): Promise<{
  success: boolean
  data?: any
  message?: string
}> {
  try {
    const config = await getWechatPayConfig()
    if (!config) {
      return { success: false, message: '微信支付配置未启用' }
    }
    
    const wxpay = initWechatPayClient(config)
    
    // 使用商户订单号查询订单（APIv3）
    const response = await wxpay.v3.pay.transactions.outTradeNo[orderNo].get({
      params: {
        mchid: config.merchantId
      }
    })
    
    return {
      success: true,
      data: response.data
    }
    
  } catch (error: any) {
    console.error('查询微信支付订单失败:', error)
    
    // 处理不同类型的错误
    if (error.response?.status === 404) {
      return { 
        success: true, 
        data: { trade_state: 'NOTPAY' }, 
        message: '订单不存在或尚未支付' 
      }
    }
    
    return { 
      success: false, 
      message: error.response?.data?.message || '查询订单失败' 
    }
  }
}

// 处理微信支付回调（APIv3）
export async function handleWechatPayCallback(req: any): Promise<{
  success: boolean
  message?: string
}> {
  try {
    const config = await getWechatPayConfig()
    if (!config) {
      return { success: false, message: '微信支付配置未启用' }
    }
    
    console.log('收到微信支付回调:', JSON.stringify(req.body, null, 2))
    
    // V3回调格式处理
    let orderData: any = null
    
    if (req.body.resource) {
      // V3加密回调格式
      try {
        const { AesGcm } = require('wechatpay-axios-plugin')
        
        // 解密回调数据
        const decryptedData = AesGcm.decrypt(
          req.body.resource.ciphertext,
          config.merchantKey, // V3密钥
          req.body.resource.nonce,
          req.body.resource.associated_data
        )
        
        orderData = JSON.parse(decryptedData)
        console.log('解密后的订单数据:', orderData)
        
      } catch (decryptError) {
        console.error('解密回调数据失败:', decryptError)
        return { success: false, message: '数据解密失败' }
    }
    } else if (req.body.out_trade_no) {
      // 直接的回调格式（可能是测试环境）
      orderData = req.body
      console.log('直接回调数据:', orderData)
    } else {
      console.error('无法识别的回调格式:', req.body)
      return { success: false, message: '回调数据格式错误' }
    }
    
    // 提取订单信息
    const orderNo = orderData.out_trade_no
    const wechatOrderId = orderData.transaction_id
    const totalAmount = orderData.amount ? orderData.amount.total : (parseInt(orderData.total_fee) || 0)
    const tradeState = orderData.trade_state || orderData.result_code
    
    console.log('提取的订单信息:', {
      orderNo,
      wechatOrderId, 
      totalAmount,
      tradeState
    })
    
    if (!orderNo) {
      return { success: false, message: '订单号不存在' }
    }
    
    // 检查支付状态
    if (tradeState !== 'SUCCESS') {
      console.log('支付状态不是成功:', tradeState)
      return { success: false, message: '支付未成功' }
    }
    
    return await processPaymentSuccess({
      orderNo,
      wechatOrderId,
      totalAmount,
      rawData: orderData
    })
    
  } catch (error) {
    console.error('处理微信支付回调失败:', error)
    return { success: false, message: '处理回调失败' }
  }
}

// 处理支付成功的逻辑
async function processPaymentSuccess(params: {
  orderNo: string
  wechatOrderId: string
  totalAmount: number
  rawData: any
}): Promise<{ success: boolean; message?: string }> {
  const { orderNo, wechatOrderId, totalAmount, rawData } = params
  
  try {
    // 查找订单
    const order = await prisma.paymentOrder.findUnique({
      where: { orderNo },
      include: { user: true }
    })
    
    if (!order) {
      return { success: false, message: '订单不存在' }
    }
    
    // 验证金额
    if (order.amount !== totalAmount) {
      return { success: false, message: '金额不匹配' }
    }
    
    // 如果订单已经是支付状态，直接返回成功
    if (order.status === 'paid') {
      return { success: true }
    }
    
    console.log('开始处理支付成功逻辑:', {
      orderId: order.id,
      userId: order.userId,
      currentStatus: order.status,
      amount: order.amount,
      paymentType: order.paymentType
    })
    
    // 更新订单状态
    await prisma.paymentOrder.update({
      where: { id: order.id },
      data: {
        status: 'paid',
        wechatOrderId,
        paidTime: new Date(),
        notifyData: JSON.stringify(rawData)
      }
    })
    
    console.log('订单状态已更新为已支付')
    
    // 更新用户权限
    const expireTime = new Date()
    let monthsToAdd = 1 // 默认1个月
    
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
    }
    
    // 如果用户已有有效期，从有效期开始计算，否则从当前时间开始
    if (order.user.expireTime && order.user.expireTime > new Date()) {
      expireTime.setTime(order.user.expireTime.getTime())
    }
    
    expireTime.setMonth(expireTime.getMonth() + monthsToAdd)
    
    console.log('准备更新用户信息:', {
      userId: order.userId,
      currentUserType: order.user.userType,
      currentExpireTime: order.user.expireTime,
      newUserType: 'premium',
      newPaymentType: order.paymentType,
      newExpireTime: expireTime,
      monthsToAdd
    })
    
    // 更新用户信息
    const updatedUser = await prisma.user.update({
      where: { id: order.userId },
      data: {
        userType: 'premium',
        paymentType: order.paymentType,
        expireTime
      }
    })
    
    console.log('用户信息更新成功:', {
      userId: updatedUser.id,
      userType: updatedUser.userType,
      paymentType: updatedUser.paymentType,
      expireTime: updatedUser.expireTime
    })
    
    return { success: true }
    
  } catch (error) {
    console.error('处理微信支付回调失败:', error)
    return { success: false, message: '处理回调失败' }
  }
} 