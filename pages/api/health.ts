import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
import Redis from 'redis'

const prisma = new PrismaClient()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'finc-tools',
      checks: {
        database: 'checking',
        redis: 'checking',
        application: 'ok'
      }
    }

    // 检查数据库连接
    try {
      await prisma.$queryRaw`SELECT 1`
      health.checks.database = 'ok'
    } catch (error) {
      console.error('Database health check failed:', error)
      health.checks.database = 'error'
      health.status = 'degraded'
    }

    // 检查 Redis 连接
    try {
      const redis = Redis.createClient({ url: process.env.REDIS_URL })
      await redis.connect()
      await redis.ping()
      await redis.disconnect()
      health.checks.redis = 'ok'
    } catch (error) {
      console.error('Redis health check failed:', error)
      health.checks.redis = 'error'
      health.status = 'degraded'
    }

    // 如果所有检查都通过，返回200，否则返回503
    const statusCode = health.status === 'ok' ? 200 : 503
    return res.status(statusCode).json(health)

  } catch (error) {
    console.error('Health check error:', error)
    return res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      service: 'finc-tools',
      error: 'Internal server error'
    })
  } finally {
    await prisma.$disconnect()
  }
} 