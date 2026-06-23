// 环境变量配置 - 支持运行时动态读取
export const getFinancialAiAgentUrl = (): string => {
  const defaultUrl = "http://localhost:8088/chat"

  // 在服务器端可以访问所有环境变量
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_FINANCIAL_AI_AGENT_URL ||
           process.env.FINANCIAL_AI_AGENT_URL ||
           defaultUrl
  }

  // 在客户端只能访问NEXT_PUBLIC_开头的环境变量
  return process.env.NEXT_PUBLIC_FINANCIAL_AI_AGENT_URL || defaultUrl
}

// 服务器端专用函数 - 用于API路由
export const getServerFinancialAiAgentUrl = (): string => {
  const defaultUrl = "http://localhost:8088/chat"
  return process.env.NEXT_PUBLIC_FINANCIAL_AI_AGENT_URL ||
         process.env.FINANCIAL_AI_AGENT_URL ||
         defaultUrl
}
