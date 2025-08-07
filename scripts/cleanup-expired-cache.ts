import { cleanupExpiredCache, getCacheStats } from '../lib/ai-analysis-cache'

async function main() {
  try {
    console.log('=== AI分析缓存清理任务开始 ===')
    
    // 获取清理前的统计信息
    const beforeStats = await getCacheStats()
    console.log('清理前统计:')
    console.log(`  总计: ${beforeStats.total}`)
    console.log(`  有效: ${beforeStats.valid}`)
    console.log(`  过期: ${beforeStats.expired}`)
    console.log(`  待处理: ${beforeStats.pending}`)
    console.log(`  失败: ${beforeStats.failed}`)
    
    // 执行清理
    const deletedCount = await cleanupExpiredCache()
    
    // 获取清理后的统计信息
    const afterStats = await getCacheStats()
    console.log('\n清理后统计:')
    console.log(`  总计: ${afterStats.total}`)
    console.log(`  有效: ${afterStats.valid}`)
    console.log(`  过期: ${afterStats.expired}`)
    console.log(`  待处理: ${afterStats.pending}`)
    console.log(`  失败: ${afterStats.failed}`)
    
    console.log(`\n清理完成，删除了 ${deletedCount} 条过期缓存记录`)
    console.log('=== AI分析缓存清理任务结束 ===')
    
    process.exit(0)
  } catch (error) {
    console.error('清理缓存失败:', error)
    process.exit(1)
  }
}

// 如果直接运行这个脚本
if (require.main === module) {
  main()
} 