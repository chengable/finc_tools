import { requireAdmin, AuthenticatedRequest } from '../../../lib/admin-middleware'
import { prisma } from '../../../lib/prisma'
import { NextApiResponse } from 'next'

interface UserQuery {
  search?: string
  userType?: string
  status?: string
  page?: number
  limit?: number
}

const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  if (req.method === 'GET') {
    // 获取用户列表
    try {
      const {
        search = '',
        userType = '',
        status = '',
        page = 1,
        limit = 10
      } = req.query as UserQuery

      const pageNum = Number(page)
      const limitNum = Number(limit)
      const skip = (pageNum - 1) * limitNum

      // 构建查询条件
      const where: any = {}

      // 搜索条件
      if (search) {
        where.OR = [
          { username: { contains: search } },
          { nickname: { contains: search } }
        ]
      }

      // 用户类型筛选
      if (userType && userType !== 'all') {
        where.userType = userType
      }

      // 状态筛选
      if (status && status !== 'all') {
        where.status = status
      }

      // 获取总数
      const total = await prisma.user.count({ where })

      // 获取用户列表
      const users = await prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          id: true,
          userId8Digit: true,
          username: true,
          nickname: true,
          avatar: true,
          userType: true,
          status: true,
          canLogin: true,
          paymentType: true,
          expireTime: true,
          lastLoginTime: true,
          createdAt: true
        }
      })

      res.status(200).json({
        users,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum)
        }
      })
    } catch (error) {
      console.error('Get users error:', error)
      res.status(500).json({ message: '获取用户列表失败' })
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' })
  }
}

export default requireAdmin(handler) 