import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: '方法不允许' })
  }

  try {
    // 清除JWT token cookie
    // 设置多种cookie清除策略以确保在不同情况下都能清除
    const isProduction = process.env.NODE_ENV === 'production'
    const cookieOptions = [
      // 标准清除
      `jwt_token=; Path=/; HttpOnly; ${isProduction ? 'Secure;' : ''} SameSite=Strict; Max-Age=0`,
      // 带过期时间的清除
      `jwt_token=; Path=/; HttpOnly; ${isProduction ? 'Secure;' : ''} SameSite=Strict; Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
      // 简化清除（兼容性）
      `jwt_token=; Path=/; Max-Age=0`
    ]
    res.setHeader('Set-Cookie', cookieOptions)

    res.status(200).json({ 
      success: true, 
      message: '退出登录成功' 
    })

  } catch (error) {
    console.error('退出登录失败:', error)
    res.status(500).json({ 
      success: false, 
      message: '服务器内部错误' 
    })
  }
} 