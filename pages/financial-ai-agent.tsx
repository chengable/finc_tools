import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import TopHeader from '../components/TopHeader'

const FINANCIAL_AI_AGENT_URL = 'https://www.your-tools.top/agents/cmizuctk00000mcmkzm13mex2/chat'

export default function FinancialAIAgent() {
  // 直接显示跳转链接，无需任何权限验证
  return (
    <>
      <Head>
        <title>财报智能体 - Finc Tools</title>
        <meta name="description" content="专业的财报智能分析工具，提供AI驱动的财务数据分析和洞察" />
      </Head>

      <div className="min-h-screen text-white" style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 25%, #0f3460 50%, #533483 75%, #7b2cbf 100%)'
      }}>
        <TopHeader />

        <div className="container mx-auto px-4 py-8" style={{ paddingTop: '100px' }}>
          <div className="text-center">
            <div className="max-w-3xl mx-auto">
              <div className="text-amber-500 text-6xl mb-6">🤖</div>
              <h1 className="text-4xl font-extrabold mb-6">
                <span style={{
                  background: 'linear-gradient(135deg, #f59e0b, #f97316, #eab308)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  财报智能体
                </span>
              </h1>
              <p className="text-xl text-gray-300 mb-8">
                AI驱动的专业财报分析工具，通过自然语言对话获取深度财务洞察
              </p>

              {/* 主要打开链接 */}
              <div className="bg-gray-800 bg-opacity-50 rounded-2xl border border-amber-500/30 p-10 mb-8">
                <p className="text-gray-300 text-xl mb-8">
                  点击下方按钮在新标签页打开财报智能体
                </p>
                <a
                  href={FINANCIAL_AI_AGENT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold py-5 px-16 rounded-full transition-all transform hover:scale-105 text-xl"
                  style={{
                    boxShadow: '0 0 30px rgba(245, 158, 11, 0.4), 0 0 60px rgba(249, 115, 22, 0.3)'
                  }}
                >
                  <span className="inline-flex items-center">
                    <svg className="w-7 h-7 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                    </svg>
                    打开财报智能体
                  </span>
                </a>
                <p className="text-gray-400 text-base mt-6">
                  将在新标签页中打开，您可以继续浏览本网站
                </p>
              </div>

              {/* 功能介绍 */}
              <div className="bg-gradient-to-r from-amber-900/30 to-orange-900/30 rounded-2xl border border-amber-500/20 p-8 mb-8 text-left">
                <h2 className="text-2xl font-bold mb-6 text-center" style={{
                  background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  功能特点
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="flex items-start">
                    <span className="text-2xl mr-3">📊</span>
                    <div>
                      <h3 className="font-bold text-lg mb-2">财务数据分析</h3>
                      <p className="text-gray-300 text-sm">深度解析企业资产负债表、利润表、现金流量表</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="text-2xl mr-3">🎯</span>
                    <div>
                      <h3 className="font-bold text-lg mb-2">指标解读</h3>
                      <p className="text-gray-300 text-sm">智能解读各类财务指标，提供专业投资建议</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="text-2xl mr-3">💬</span>
                    <div>
                      <h3 className="font-bold text-lg mb-2">自然语言交互</h3>
                      <p className="text-gray-300 text-sm">像聊天一样提问，轻松获取财务分析结果</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="text-2xl mr-3">⚡</span>
                    <div>
                      <h3 className="font-bold text-lg mb-2">实时响应</h3>
                      <p className="text-gray-300 text-sm">快速响应用户查询，提供即时分析结果</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Link href="/" className="text-amber-400 hover:text-amber-300 underline text-lg">
                  ← 返回首页
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}