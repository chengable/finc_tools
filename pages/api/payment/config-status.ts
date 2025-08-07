import { NextApiRequest, NextApiResponse } from 'next'
import { getWechatPayConfig, validateWechatPayConfig } from '../../../lib/wechat-pay'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: '方法不允许' })
  }

  try {
    const config = await getWechatPayConfig()
    
    if (!config) {
      return res.status(200).json({
        success: true,
        status: 'disabled',
        message: '微信支付未配置或已禁用',
        errors: ['微信支付配置未启用']
      })
    }

    // 验证配置完整性
    const validation = validateWechatPayConfig(config)

    return res.status(200).json({
      success: true,
      status: validation.isValid ? 'enabled' : 'invalid',
      message: validation.isValid ? '微信支付配置正常' : '微信支付配置存在问题',
      errors: validation.errors,
      config: {
        hasAppId: !!config.appId,
        hasMerchantId: !!config.merchantId,
        hasMerchantKey: !!config.merchantKey,
        hasCallbackUrl: !!config.callbackUrl,
        appIdValid: config.appId?.startsWith('wx') || false,
        merchantIdValid: config.merchantId?.length === 10 || false,
        merchantKeyValid: config.merchantKey?.length === 32 || false,
        callbackUrlValid: config.callbackUrl?.startsWith('https://') || false
      }
    })
  } catch (error) {
    console.error('检查微信支付配置失败:', error)
    return res.status(500).json({
      success: false,
      message: '检查配置时发生错误'
    })
  }
} 