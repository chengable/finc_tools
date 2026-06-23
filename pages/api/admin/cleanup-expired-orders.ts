import { NextApiRequest, NextApiResponse } from 'next'
import { verifyToken } from '../../../lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanupExpiredOrders() {
  try {
    console.log('开始清理过期的未支付订单...')
    
    // 计算一天前的时间
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    
    // 查找一天前创建且状态为pending的订单
    const expiredOrders = await prisma.paymentOrder.findMany({
      where: {
        status: 'pending',
        createdAt: {
          lt: oneDayAgo
        }
      },
      select: {
        id: true,
        orderNo: true,
        createdAt: true,
        amount: true
      }
    })
    
    console.log(`找到 ${expiredOrders.length} 个过期的未支付订单`)
    
    let deleteCount = 0
    const cleanedOrders: Array<{orderNo: string, createdAt: string, amount: number}> = []
    
    if (expiredOrders.length > 0) {
      // 记录过期订单信息
      expiredOrders.forEach(order => {
        console.log(`- 订单号: ${order.orderNo}, 创建时间: ${order.createdAt.toISOString()}, 金额: ${order.amount}分`)
        cleanedOrders.push({
          orderNo: order.orderNo,
          createdAt: order.createdAt.toISOString(),
          amount: order.amount
        })
      })
      
      // 批量删除过期订单
      const deleteResult = await prisma.paymentOrder.deleteMany({
        where: {
          id: {
            in: expiredOrders.map(order => order.id)
          }
        }
      })
      
      deleteCount = deleteResult.count
      console.log(`成功清理 ${deleteCount} 个过期订单`)
    } else {
      console.log('没有找到需要清理的过期订单')
    }
    
    // 返回清理结果
    return {
      totalFound: expiredOrders.length,
      totalCleaned: deleteCount,
      cleanedOrders
    }
    
  } catch (error) {
    console.error('清理过期订单时出错:', error)
    throw error
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: '请求方法不支持' })
  }

  try {
    // 验证管理员身份
    const token = req.cookies.jwt_token || req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return res.status(401).json({ success: false, message: '请先登录' })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.userType !== 'admin') {
      return res.status(403).json({ success: false, message: '权限不足，仅管理员可执行此操作' })
    }

    console.log('管理员手动触发清理过期订单')

    // 执行清理操作
    const result = await cleanupExpiredOrders()

    return res.status(200).json({
      success: true,
      message: '清理操作执行完成',
      data: result
    })

  } catch (error) {
    console.error('清理过期订单API错误:', error)
    return res.status(500).json({ 
      success: false, 
      message: '清理失败：' + (error instanceof Error ? error.message : '未知错误')
    })
  }
} 