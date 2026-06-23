import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../lib/auth'

const prisma = new PrismaClient()

async function main() {
  console.log('开始初始化管理员用户...')

  const adminUsername = process.env.ADMIN_USERNAME || 'admin'
  const adminPassword = process.env.ADMIN_PASSWORD
  const adminAuthKey = process.env.ADMIN_AUTH_KEY

  if (!adminPassword || !adminAuthKey) {
    console.error('错误: 请设置 ADMIN_PASSWORD 和 ADMIN_AUTH_KEY 环境变量')
    process.exit(1)
  }

  // 检查管理员用户是否已存在
  const existingAdmin = await prisma.adminUser.findUnique({
    where: { username: adminUsername }
  })

  if (existingAdmin) {
    console.log('管理员用户已存在，跳过初始化')
    return
  }

  const hashedPassword = hashPassword(adminPassword)

  const adminUser = await prisma.adminUser.create({
    data: {
      username: adminUsername,
      password: hashedPassword,
      authKey: adminAuthKey
    }
  })

  console.log('管理员用户创建成功:', {
    id: adminUser.id,
    username: adminUser.username,
    createdAt: adminUser.createdAt
  })
}

main()
  .catch((e) => {
    console.error('初始化失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
