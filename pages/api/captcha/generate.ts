import type { NextApiRequest, NextApiResponse } from 'next'
import { generateCaptcha, storeCaptcha } from '../../../lib/captcha'
import { generateRandomString } from '../../../lib/auth'

interface CaptchaResponse {
  success: boolean
  sessionId: string
  image: string
  message?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CaptchaResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false,
      sessionId: '',
      image: '',
      message: 'Method not allowed' 
    })
  }

  try {
    const sessionId = generateRandomString(32)
    const { code, base64 } = generateCaptcha()
    
    // 存储验证码到Redis
    await storeCaptcha(sessionId, code)
    
    // 设置响应头
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
    
    res.status(200).json({
      success: true,
      sessionId,
      image: base64
    })
  } catch (error) {
    console.error('Generate captcha error:', error)
    res.status(500).json({ 
      success: false,
      sessionId: '',
      image: '',
      message: 'Internal server error' 
    })
  }
} 