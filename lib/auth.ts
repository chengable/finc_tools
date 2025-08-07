import * as jwt from 'jsonwebtoken'
import * as bcrypt from 'bcryptjs'
import { createHash } from 'crypto'
import { useState, useEffect } from 'react'
import axios from 'axios'

const JWT_SECRET = process.env.JWT_SECRET || 'chenableismroesecgoodwork'

export interface JWTPayload {
  userId: string
  username: string
  userType: 'free' | 'premium' | 'admin'
  role?: string
}

// 生成JWT token
export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

// 验证JWT token
export const verifyToken = (token: string): JWTPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch (error) {
    return null
  }
}

// SHA256哈希密码
export const hashPassword = (password: string): string => {
  return createHash('sha256').update(password).digest('hex')
}

// 验证密码
export const verifyPassword = (password: string, hashedPassword: string): boolean => {
  const hashed = hashPassword(password)
  return hashed === hashedPassword
}

// 生成随机字符串
export const generateRandomString = (length: number = 6): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

interface User {
  id: string | number
  username: string
  userType: 'free' | 'premium' | 'admin'
  nickname?: string
  avatar?: string
  remainingDays?: number
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get('/api/user/status')
        console.log('useAuth - 用户状态响应:', response.data)
        
        if (response.data.isLoggedIn && response.data.data) {
          setUser({
            id: response.data.data.id,
            username: response.data.data.username,
            userType: response.data.data.userType,
            nickname: response.data.data.nickname,
            avatar: response.data.data.avatar,
            remainingDays: response.data.data.remainingDays
          })
        } else {
          setUser(null)
        }
      } catch (error) {
        console.log('useAuth - 获取用户状态失败:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  return { user, loading }
} 