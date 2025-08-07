import { prisma } from '../lib/prisma'

async function checkSubscriptionStatus() {
  console.log('开始检查连续包月状态...')
  
  try {
    // 获取微信支付配置
    const paymentConfig = await prisma.wechatConfig.findUnique({
      where: { configType: 'payment' }
    })

    if (!paymentConfig || paymentConfig.status !== 'enabled') {
      console.log('微信支付配置未启用，跳过连续包月检查')
      return
    }

    // 查找所有连续包月用户
    const monthlyUsers = await prisma.user.findMany({
      where: {
        paymentType: 'monthly',
        userType: 'premium'
      }
    })

    console.log(`找到 ${monthlyUsers.length} 个连续包月用户`)

    // 检查每个连续包月用户的状态
    for (const user of monthlyUsers) {
      try {
        // 在实际项目中，这里应该调用微信支付查询接口检查订阅状态
        // 现在模拟检查逻辑
        const subscriptionActive = await checkWechatSubscriptionStatus(user.id, paymentConfig)
        
        if (!subscriptionActive) {
          // 如果订阅不再活跃，将用户转为一次性付费
          const currentExpireTime = user.expireTime || new Date()
          
          await prisma.user.update({
            where: { id: user.id },
            data: {
              paymentType: 'one_time',
              // 保持当前到期时间不变，按一次性付费逻辑处理
            }
          })
          
          console.log(`用户 ${user.nickname} (${user.username}) 的连续包月已取消，转为一次性付费`)
        } else {
          console.log(`用户 ${user.nickname} (${user.username}) 的连续包月状态正常`)
        }
      } catch (error) {
        console.error(`检查用户 ${user.username} 订阅状态失败:`, error)
      }
    }

    console.log('连续包月状态检查完成')
  } catch (error) {
    console.error('检查连续包月状态失败:', error)
  }
}

// 模拟微信支付订阅状态查询
async function checkWechatSubscriptionStatus(userId: string, paymentConfig: any): Promise<boolean> {
  // 在实际项目中，这里应该调用微信支付的订阅查询接口
  // 例如：
  // 1. 构造请求参数（商户号、订单号等）
  // 2. 签名验证
  // 3. 调用微信接口：https://api.mch.weixin.qq.com/pay/contractorder
  // 4. 解析返回结果，判断订阅是否还活跃
  
  console.log(`模拟检查用户 ${userId} 的微信订阅状态...`)
  
  // 模拟90%的用户订阅状态正常，10%已取消
  const isActive = Math.random() > 0.1
  
  return isActive
}

// 如果直接运行此脚本
if (require.main === module) {
  checkSubscriptionStatus()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
}

export default checkSubscriptionStatus 