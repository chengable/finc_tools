import { NextApiRequest, NextApiResponse } from 'next'
import { verifyToken } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: '方法不允许' })
  }

  try {
    // 从cookie中获取JWT token
    const token = req.cookies.jwt_token

    if (!token) {
      return res.status(200).json({ 
        isLoggedIn: false,
        user: null
      })
    }

    // 验证token
    const payload = verifyToken(token)

    if (!payload) {
      return res.status(200).json({ 
        isLoggedIn: false,
        user: null
      })
    }

    if (payload.userType === 'admin') {
      // 管理员用户
      const adminUser = await prisma.adminUser.findUnique({
        where: { id: parseInt(payload.userId) }
      })

      if (!adminUser) {
        return res.status(401).json({ 
          isLoggedIn: false, 
          message: '用户不存在' 
        })
      }

      return res.status(200).json({
        isLoggedIn: true,
        userType: 'admin',
        user: {
          id: adminUser.id,
          username: adminUser.username,
          avatar: '/default-admin-avatar.svg'
        },
        data: {
          id: adminUser.id,
          username: adminUser.username,
          userType: 'admin',
          nickname: adminUser.username,
          avatar: '/default-admin-avatar.svg'
        }
      })
    }
    
    // 普通用户
    const user = await prisma.user.findUnique({
      where: { id: payload.userId }
    })

    if (!user) {
      return res.status(401).json({ 
        isLoggedIn: false, 
        message: '用户不存在' 
      })
    }

    // 计算剩余天数
    let remainingDays = null
    if (user.userType === 'premium' && user.expireTime) {
      const now = new Date()
      const expireTime = new Date(user.expireTime)
      remainingDays = Math.ceil((expireTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      
      // 如果已过期，更新用户类型
      if (remainingDays <= 0) {
        await prisma.user.update({
          where: { id: user.id },
          data: { userType: 'free', expireTime: null }
        })
        user.userType = 'free'
        user.expireTime = null
        remainingDays = null
      }
    }

    return res.status(200).json({
      isLoggedIn: true,
      userType: user.userType,
      user: {
        id: user.id,
        nickname: user.nickname,
        avatar: user.avatar || '/default-user-avatar.svg',
        remainingDays
      },
      data: {
        id: user.id,
        username: user.username,
        userType: user.userType,
        nickname: user.nickname,
        avatar: user.avatar || '/default-user-avatar.svg',
        remainingDays
      }
    })
  } catch (error) {
    console.error('检查用户状态失败:', error)
    res.status(500).json({ 
      success: false, 
      message: '服务器内部错误' 
    })
  }
} 