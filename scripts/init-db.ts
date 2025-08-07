import { PrismaClient } from '@prisma/client'
import { hashPassword, generateRandomString } from '../lib/auth'

const prisma = new PrismaClient()

async function main() {
  console.log('开始初始化数据库...')

  // 创建管理员用户
  try {
    const adminUser = await prisma.adminUser.upsert({
      where: { username: 'developer' },
      update: {},
      create: {
        username: 'developer',
        password: hashPassword('cheng123'), // 请修改为安全密码
        authKey: 'developer_finctools' // 请修改为安全的AUTH_KEY
      }
    })
    console.log('管理员用户创建成功:', adminUser.username)

    // 同时在User表中创建管理员用户记录，用于任务创建等功能
    const adminUserInUserTable = await prisma.user.upsert({
      where: { username: 'developer' },
      update: {},
      create: {
        userId8Digit: '10000001', // 固定的8位ID
        username: 'developer',
        openid: 'admin_developer',
        nickname: '系统管理员',
        avatar: '/default-admin-avatar.svg',
        userType: 'admin',
        status: 'online',
        canLogin: true,
        paymentType: null,
        expireTime: null,
        lastLoginTime: new Date()
      }
    })
    console.log('管理员用户在User表中创建成功:', adminUserInUserTable.username)
  } catch (error) {
    console.error('创建管理员用户失败:', error)
  }

  // 生成8位数字ID的函数
  const generate8DigitId = () => {
    return Math.floor(10000000 + Math.random() * 90000000).toString()
  }


  // 创建微信配置
  try {
    // 微信登录配置
    await prisma.wechatConfig.upsert({
      where: { configType: 'login' },
      update: {},
      create: {
        configType: 'login',
        appId: 'wx1234567890abcdef',
        appSecret: 'your_wechat_app_secret_here',
        callbackUrl: 'https://finc.ai/api/wechat/callback',
        status: 'disabled'
      }
    })

    // 微信支付配置
    await prisma.wechatConfig.upsert({
      where: { configType: 'payment' },
      update: {},
      create: {
        configType: 'payment',
        merchantId: '1234567890',
        merchantKey: 'your_wechat_merchant_key_here',
        payCallbackUrl: 'https://finc.ai/api/wechat/pay/callback',
        certPath: '/etc/ssl/wechat/apiclient_cert.pem',
        keyPath: '/etc/ssl/wechat/apiclient_key.pem',
        status: 'disabled'
      }
    })

    console.log('微信配置创建成功')
  } catch (error) {
    console.error('创建微信配置失败:', error)
  }

  console.log('数据库初始化完成!')
}

main()
  .catch((e) => {
    console.error('初始化失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 