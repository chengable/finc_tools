import { prisma } from '../lib/prisma'

async function checkExpiredUsers() {
  console.log('开始检查过期用户...')
  
  try {
    const now = new Date()
    
    // 查找所有付费到期的用户
    const expiredUsers = await prisma.user.findMany({
      where: {
        expireTime: {
          lte: now
        },
        userType: 'premium'
      }
    })

    console.log(`找到 ${expiredUsers.length} 个过期用户`)

    // 批量更新过期用户状态
    for (const user of expiredUsers) {
      try {
        // 将用户改为免费版
        await prisma.user.update({
          where: { id: user.id },
          data: {
            userType: 'free',
            paymentType: null,
            expireTime: null
          }
        })
        
        console.log(`用户 ${user.nickname} (${user.username}) 已从专业版降级为免费版`)
      } catch (error) {
        console.error(`更新用户 ${user.username} 失败:`, error)
      }
    }

    // 查找即将过期的用户（7天内）
    const soonExpireUsers = await prisma.user.findMany({
      where: {
        expireTime: {
          gte: now,
          lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        },
        userType: 'premium'
      }
    })

    console.log(`找到 ${soonExpireUsers.length} 个即将过期的用户`)
    soonExpireUsers.forEach((user: any) => {
      const daysLeft = Math.ceil((user.expireTime!.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
      console.log(`用户 ${user.nickname} (${user.username}) 将在 ${daysLeft} 天后过期`)
    })

    console.log('用户到期检查完成')
  } catch (error) {
    console.error('检查过期用户失败:', error)
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  checkExpiredUsers()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
}

export default checkExpiredUsers 