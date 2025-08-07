import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../lib/auth'

const prisma = new PrismaClient()

async function main() {
  console.log('开始初始化管理员用户...')

  // 检查管理员用户是否已存在
  const existingAdmin = await prisma.adminUser.findUnique({
    where: { username: 'developer' }
  })

  if (existingAdmin) {
    console.log('管理员用户已存在，跳过初始化')
    return
  }

  // 创建管理员用户
  const hashedPassword = hashPassword('cheng123')
  
  const adminUser = await prisma.adminUser.create({
    data: {
      username: 'developer',
      password: hashedPassword,
      authKey: 'developer_finctools'
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