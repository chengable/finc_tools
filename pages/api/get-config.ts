import { NextApiRequest, NextApiResponse } from 'next'
import { getServerFinancialAiAgentUrl } from '../../lib/env-config'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const financialAiAgentUrl = getServerFinancialAiAgentUrl()

    console.log('API获取配置调试信息:')
    console.log('NEXT_PUBLIC_FINANCIAL_AI_AGENT_URL:', process.env.NEXT_PUBLIC_FINANCIAL_AI_AGENT_URL)
    console.log('FINANCIAL_AI_AGENT_URL:', process.env.FINANCIAL_AI_AGENT_URL)
    console.log('返回的URL:', financialAiAgentUrl)

    res.status(200).json({
      success: true,
      data: {
        financialAiAgentUrl,
        // 添加调试信息
        debug: {
          hasNextPublic: !!process.env.NEXT_PUBLIC_FINANCIAL_AI_AGENT_URL,
          hasServer: !!process.env.FINANCIAL_AI_AGENT_URL,
          nextPublicValue: process.env.NEXT_PUBLIC_FINANCIAL_AI_AGENT_URL?.substring(0, 20) + '...',
        }
      }
    })
  } catch (error) {
    console.error('获取配置失败:', error)
    res.status(500).json({
      success: false,
      error: '获取配置失败'
    })
  }
}