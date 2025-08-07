import { requireAdmin, AuthenticatedRequest } from '../../../lib/admin-middleware'
import { NextApiResponse } from 'next'
import { 
  getCacheStats, 
  cleanupExpiredCache 
} from '../../../lib/ai-analysis-cache'

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      // 获取缓存统计信息
      const stats = await getCacheStats()
      
      return res.status(200).json({
        success: true,
        data: {
          ...stats,
          description: {
            total: '总缓存数量',
            valid: '有效缓存数量',
            expired: '过期缓存数量',
            pending: '待处理缓存数量',
            failed: '失败缓存数量'
          }
        }
      })
      
    } else if (req.method === 'DELETE') {
      // 清理过期缓存
      const deletedCount = await cleanupExpiredCache()
      
      return res.status(200).json({
        success: true,
        message: `成功清理了 ${deletedCount} 条过期缓存记录`,
        data: {
          deletedCount
        }
      })
      
    } else {
      return res.status(405).json({
        success: false,
        message: '方法不允许'
      })
    }
    
  } catch (error) {
    console.error('AI分析缓存管理API错误:', error)
    return res.status(500).json({
      success: false,
      message: '服务器内部错误'
    })
  }
}

// 使用管理员中间件包装处理函数
export default requireAdmin(handler) 