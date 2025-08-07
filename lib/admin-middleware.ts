import { NextApiRequest, NextApiResponse } from 'next'
import { verifyToken, JWTPayload } from './auth'

export interface AuthenticatedRequest extends NextApiRequest {
  user?: JWTPayload
}

type Handler = (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void> | void

// 管理员权限验证中间件
export const requireAdmin = (handler: Handler) => {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
    try {
      // 从cookie中获取token
      let token = req.cookies.jwt_token

      // 如果cookie中没有，尝试从Authorization header获取
      if (!token && req.headers.authorization) {
        const authHeader = req.headers.authorization
        if (authHeader.startsWith('Bearer ')) {
          token = authHeader.substring(7)
        }
      }

      if (!token) {
        return res.status(401).json({ message: '未登录' })
      }

      // 验证token
      const payload = verifyToken(token)
      if (!payload) {
        return res.status(401).json({ message: '登录已过期' })
      }

      // 检查是否为管理员
      if (payload.userType !== 'admin') {
        return res.status(403).json({ message: '权限不足' })
      }

      // 将用户信息附加到请求对象
      req.user = payload

      // 调用实际的处理函数
      return handler(req, res)
    } catch (error) {
      console.error('Admin middleware error:', error)
      return res.status(500).json({ message: '服务器内部错误' })
    }
  }
}

// 用户身份验证中间件（可选的管理员验证）
export const optionalAdmin = (handler: Handler) => {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
    try {
      // 从cookie中获取token
      let token = req.cookies.jwt_token

      // 如果cookie中没有，尝试从Authorization header获取
      if (!token && req.headers.authorization) {
        const authHeader = req.headers.authorization
        if (authHeader.startsWith('Bearer ')) {
          token = authHeader.substring(7)
        }
      }

      if (token) {
        // 验证token
        const payload = verifyToken(token)
        if (payload) {
          req.user = payload
        }
      }

      // 调用实际的处理函数
      return handler(req, res)
    } catch (error) {
      console.error('Optional admin middleware error:', error)
      return handler(req, res)
    }
  }
} 