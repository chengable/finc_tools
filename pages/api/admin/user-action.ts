import { requireAdmin, AuthenticatedRequest } from '../../../lib/admin-middleware'
import { prisma } from '../../../lib/prisma'
import { NextApiResponse } from 'next'

interface UserActionRequest {
  userId: string
  action: 'disable' | 'enable' | 'delete' | 'change_user_type'
  userType?: 'free' | 'premium' | 'admin'
  expireTime?: string
}

const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  if (req.method === 'POST') {
    try {
      const { userId, action, userType, expireTime } = req.body as UserActionRequest

      if (!userId || !action) {
        return res.status(400).json({ message: '参数不完整' })
      }

      // 检查用户是否存在
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })

      if (!user) {
        return res.status(404).json({ message: '用户不存在' })
      }

      switch (action) {
        case 'disable':
          // 禁用用户
          await prisma.user.update({
            where: { id: userId },
            data: { canLogin: false }
          })
          res.status(200).json({ message: '用户已禁用' })
          break

        case 'enable':
          // 启用用户
          await prisma.user.update({
            where: { id: userId },
            data: { canLogin: true }
          })
          res.status(200).json({ message: '用户已启用' })
          break

        case 'delete':
          // 删除用户
          await prisma.user.delete({
            where: { id: userId }
          })
          res.status(200).json({ message: '用户已删除' })
          break

        case 'change_user_type':
          // 切换用户身份
          if (!userType || !['free', 'premium', 'admin'].includes(userType)) {
            return res.status(400).json({ message: '无效的用户类型' })
          }

          const updateData: any = { userType }
          
          // 如果切换为premium，需要设置过期时间
          if (userType === 'premium') {
            if (expireTime) {
              // 使用前端传来的到期时间
              updateData.expireTime = new Date(expireTime)
            } else {
              // 默认1个月
              const defaultExpireTime = new Date()
              defaultExpireTime.setMonth(defaultExpireTime.getMonth() + 1)
              updateData.expireTime = defaultExpireTime
            }
            updateData.paymentType = '1_month'
          } else if (userType === 'free') {
            // 切换为免费用户时，清除过期时间和付费类型
            updateData.expireTime = null
            updateData.paymentType = null
          } else if (userType === 'admin') {
            // 切换为管理员时，清除过期时间和付费类型
            updateData.expireTime = null
            updateData.paymentType = null
          }

          await prisma.user.update({
            where: { id: userId },
            data: updateData
          })
          
          const userTypeNames = {
            'free': '免费版用户',
            'premium': '专家版用户',
            'admin': '管理员'
          }
          
          res.status(200).json({ 
            message: `用户身份已切换为${userTypeNames[userType]}`,
            userType: userType
          })
          break

        default:
          res.status(400).json({ message: '无效的操作类型' })
          break
      }
    } catch (error) {
      console.error('User action error:', error)
      res.status(500).json({ message: '操作失败' })
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' })
  }
}

export default requireAdmin(handler) 