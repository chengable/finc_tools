import { NextApiRequest, NextApiResponse } from 'next'
import { randomUUID } from 'crypto'
import { prisma } from '../../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: '方法不允许'
    })
  }

  try {
    // 从数据库获取微信登录配置
    const wechatConfig = await prisma.wechatConfig.findUnique({
      where: { configType: 'login' }
    })

    if (!wechatConfig || wechatConfig.status !== 'enabled') {
      return res.status(400).json({ 
        success: false, 
        message: '微信登录功能未启用' 
      })
    }

    if (!wechatConfig.appId || !wechatConfig.callbackUrl) {
      return res.status(400).json({ 
        success: false,
        message: '微信登录配置不完整'
      })
    }

    // 生成状态参数
    const state = randomUUID()
    
    // 构建微信授权URL
    const authUrl = `https://open.weixin.qq.com/connect/qrconnect?` +
      `appid=${wechatConfig.appId}&` +
      `redirect_uri=${encodeURIComponent(wechatConfig.callbackUrl)}&` +
      `response_type=code&` +
      `scope=snsapi_login&` +
      `state=${state}#wechat_redirect`

    console.log('生成微信登录URL成功:', {
      appId: wechatConfig.appId,
      redirectUri: wechatConfig.callbackUrl,
      state: state
    })

    res.status(200).json({
      success: true,
      data: {
        appId: wechatConfig.appId,
        redirectUri: wechatConfig.callbackUrl,
        state: state,
        authUrl: authUrl,
        expireTime: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10分钟过期
      }
    })

  } catch (error) {
    console.error('生成微信登录URL失败:', error)
    
    res.status(500).json({
      success: false,
      message: '生成登录链接失败'
    })
  }
} 