#!/usr/bin/env node

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
    if (require.main === module) {
      process.exit(1)
    }
    throw error // 如果是作为模块被调用，抛出错误而不是退出进程
  } finally {
    // 只有在作为主模块运行时才断开数据库连接
    if (require.main === module) {
      await prisma.$disconnect()
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  cleanupExpiredOrders()
    .then(() => {
      console.log('清理任务完成')
      process.exit(0)
    })
    .catch((error) => {
      console.error('清理任务失败:', error)
      process.exit(1)
    })
}

export { cleanupExpiredOrders } 