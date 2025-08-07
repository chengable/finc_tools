import { createClient, RedisClientType } from 'redis'

// 全局变量来存储Redis客户端实例，避免重复创建
declare global {
  var __redis: RedisClientType | undefined
}

let client: RedisClientType

if (process.env.NODE_ENV === 'production') {
  client = createClient({
    url: process.env.REDIS_URL
  })
} else {
  // 在开发环境中使用全局变量来避免热重载时重复创建连接
  if (!global.__redis) {
    global.__redis = createClient({
  url: process.env.REDIS_URL
})
  }
  client = global.__redis
}

client.on('error', (err) => console.log('Redis Client Error', err))

export const getRedisClient = async () => {
  if (!client.isOpen) {
    await client.connect()
  }
  return client
} 