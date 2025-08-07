import { prisma } from './prisma'
import crypto from 'crypto'

// AI分析缓存接口定义
export interface AiAnalysisCacheKey {
  companyCode: string
  companyName?: string
  analysisType: 'financial_data' | 'financial_indicators' | 'indicator_detail'
  dataItem?: string // 对于指标详细分析，这里是指标名称
  reportPeriod: string
  timeRange: string
}

export interface AiAnalysisCacheResult {
  id: string
  aiAnalysis: string | null
  createdAt: Date
  expiresAt: Date
  isExpired: boolean
}

// 生成查询条件的哈希值
export function generateQueryHash(key: AiAnalysisCacheKey): string {
  const data = {
    companyCode: key.companyCode,
    analysisType: key.analysisType,
    dataItem: key.dataItem || '',
    reportPeriod: key.reportPeriod,
    timeRange: key.timeRange
  }
  
  const jsonString = JSON.stringify(data, Object.keys(data).sort())
  return crypto.createHash('md5').update(jsonString).digest('hex')
}

// 检查缓存是否存在且有效
export async function getCachedAnalysis(key: AiAnalysisCacheKey): Promise<AiAnalysisCacheResult | null> {
  try {
    const queryHash = generateQueryHash(key)
    const now = new Date()
    
    const cache = await prisma.aiAnalysisCache.findUnique({
      where: { queryHash }
    })
    
    if (!cache) {
      return null
    }
    
    const isExpired = cache.expiresAt < now
    
    return {
      id: cache.id,
      aiAnalysis: cache.aiAnalysis,
      createdAt: cache.createdAt,
      expiresAt: cache.expiresAt,
      isExpired
    }
  } catch (error) {
    console.error('查询AI分析缓存失败:', error)
    return null
  }
}

// 保存AI分析结果到缓存
export async function saveAnalysisToCache(
  key: AiAnalysisCacheKey, 
  analysis: string
): Promise<boolean> {
  try {
    const queryHash = generateQueryHash(key)
    const now = new Date()
    const expiresAt = new Date(now.getTime() + (3 * 30 * 24 * 60 * 60 * 1000)) // 3个月后过期
    
    await prisma.aiAnalysisCache.upsert({
      where: { queryHash },
      update: {
        companyName: key.companyName,
        aiAnalysis: analysis,
        analysisStatus: 'completed',
        expiresAt,
        updatedAt: now
      },
      create: {
        companyCode: key.companyCode,
        companyName: key.companyName,
        analysisType: key.analysisType,
        dataItem: key.dataItem,
        reportPeriod: key.reportPeriod,
        timeRange: key.timeRange,
        queryHash,
        aiAnalysis: analysis,
        analysisStatus: 'completed',
        expiresAt
      }
    })
    
    return true
  } catch (error) {
    console.error('保存AI分析缓存失败:', error)
    return false
  }
}

// 创建一个待处理的缓存记录（防止并发请求重复调用AI）
export async function createPendingCache(key: AiAnalysisCacheKey): Promise<string | null> {
  try {
    const queryHash = generateQueryHash(key)
    const now = new Date()
    const expiresAt = new Date(now.getTime() + (3 * 30 * 24 * 60 * 60 * 1000)) // 3个月后过期
    
    const cache = await prisma.aiAnalysisCache.upsert({
      where: { queryHash },
      update: {
        analysisStatus: 'pending',
        updatedAt: now
      },
      create: {
        companyCode: key.companyCode,
        companyName: key.companyName,
        analysisType: key.analysisType,
        dataItem: key.dataItem,
        reportPeriod: key.reportPeriod,
        timeRange: key.timeRange,
        queryHash,
        analysisStatus: 'pending',
        expiresAt
      }
    })
    
    return cache.id
  } catch (error) {
    console.error('创建待处理缓存记录失败:', error)
    return null
  }
}

// 更新缓存状态为失败
export async function markCacheAsFailed(cacheId: string, errorMessage?: string): Promise<boolean> {
  try {
    await prisma.aiAnalysisCache.update({
      where: { id: cacheId },
      data: {
        analysisStatus: 'failed',
        aiAnalysis: errorMessage || '分析失败',
        updatedAt: new Date()
      }
    })
    return true
  } catch (error) {
    console.error('更新缓存状态失败:', error)
    return false
  }
}

// 清理过期的缓存记录
export async function cleanupExpiredCache(): Promise<number> {
  try {
    const now = new Date()
    const result = await prisma.aiAnalysisCache.deleteMany({
      where: {
        expiresAt: {
          lt: now
        }
      }
    })
    
    console.log(`清理了 ${result.count} 条过期的AI分析缓存记录`)
    return result.count
  } catch (error) {
    console.error('清理过期缓存失败:', error)
    return 0
  }
}

// 获取缓存统计信息
export async function getCacheStats(): Promise<{
  total: number
  valid: number
  expired: number
  pending: number
  failed: number
}> {
  try {
    const now = new Date()
    
    const [total, expired, pending, failed] = await Promise.all([
      prisma.aiAnalysisCache.count(),
      prisma.aiAnalysisCache.count({
        where: { expiresAt: { lt: now } }
      }),
      prisma.aiAnalysisCache.count({
        where: { analysisStatus: 'pending' }
      }),
      prisma.aiAnalysisCache.count({
        where: { analysisStatus: 'failed' }
      })
    ])
    
    const valid = total - expired
    
    return {
      total,
      valid,
      expired,
      pending,
      failed
    }
  } catch (error) {
    console.error('获取缓存统计失败:', error)
    return {
      total: 0,
      valid: 0,
      expired: 0,
      pending: 0,
      failed: 0
    }
  }
} 