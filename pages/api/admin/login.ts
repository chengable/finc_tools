import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { generateToken, verifyPassword } from '../../../lib/auth'
import { verifyCaptcha } from '../../../lib/captcha'

interface LoginRequest {
  username: string
  password: string
  authKey: string
  captcha: string
  sessionId: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { username, password, authKey, captcha, sessionId }: LoginRequest = req.body

    // 验证必填字段
    if (!username || !password || !authKey || !captcha || !sessionId) {
      return res.status(400).json({ message: '所有字段都是必填的' })
    }

    // 验证验证码
    const captchaValid = await verifyCaptcha(sessionId, captcha)
    if (!captchaValid) {
      return res.status(400).json({ message: '验证码错误或已过期' })
    }

    // 查找管理员用户
    const adminUser = await prisma.adminUser.findUnique({
      where: { username }
    })

    if (!adminUser) {
      return res.status(401).json({ message: '用户名不存在' })
    }

    // 验证AUTH_KEY
    if (adminUser.authKey !== authKey) {
      return res.status(401).json({ message: 'AUTH_KEY错误' })
    }

    // 验证密码
    if (!verifyPassword(password, adminUser.password)) {
      return res.status(401).json({ message: '密码错误' })
    }

    // 生成JWT token
    const token = generateToken({
      userId: adminUser.id.toString(),
      username: adminUser.username,
      userType: 'admin'
    })

    // 设置cookie
    res.setHeader('Set-Cookie', [
      `jwt_token=${token}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Strict`
    ])

    res.status(200).json({
      message: '登录成功',
      user: {
        id: adminUser.id,
        username: adminUser.username,
        userType: 'admin'
      }
    })
  } catch (error) {
    console.error('Admin login error:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
} 