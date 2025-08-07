import { prisma } from './prisma'
import { createWechatPayOrder } from './wechat-pay'

// 检查和处理连续包月续费 - 已废弃
// 新的定价体系不再支持连续包月，改为一次性购买套餐
export async function processMonthlyRenewal() {
  try {
    console.log('连续包月续费功能已废弃，新的定价体系为一次性购买套餐')
    return
  } catch (error) {
    console.error('处理连续包月续费任务失败:', error)
  }
}

// 检查和处理过期用户
export async function processExpiredUsers() {
  try {
    console.log('开始处理过期用户...')
    
    const now = new Date()
    
    // 查找已过期的付费用户
    const expiredUsers = await prisma.user.findMany({
      where: {
        userType: 'premium',
        expireTime: {
          lt: now
        }
      }
    })
    
    console.log(`找到 ${expiredUsers.length} 个过期用户`)
    
    for (const user of expiredUsers) {
      try {
        // 将用户降级为免费版
        await prisma.user.update({
          where: { id: user.id },
          data: {
            userType: 'free',
            paymentType: null,
            expireTime: null
          }
        })
        
        console.log(`用户 ${user.id} 已降级为免费版`)
        
      } catch (error) {
        console.error(`降级用户 ${user.id} 失败:`, error)
      }
    }
    
    console.log('过期用户处理完成')
    
  } catch (error) {
    console.error('处理过期用户失败:', error)
  }
}

// 启动定时任务（这个函数需要在应用启动时调用）
export function startPaymentScheduler() {
  // 每天凌晨2点执行续费检查
  const renewalInterval = 24 * 60 * 60 * 1000 // 24小时
  
  // 立即执行一次，然后每24小时执行一次
  processMonthlyRenewal()
  processExpiredUsers()
  
  setInterval(() => {
    processMonthlyRenewal()
    processExpiredUsers()
  }, renewalInterval)
  
  console.log('支付定时任务已启动')
}

// 手动触发续费检查（用于测试或管理员手动触发）
export async function manualRenewalCheck() {
  console.log('手动触发续费检查...')
  await processMonthlyRenewal()
  await processExpiredUsers()
  console.log('手动续费检查完成')
} 