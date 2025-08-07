import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import TopHeader from '../components/TopHeader'
import axios from 'axios'

interface UserStatus {
  isLoggedIn: boolean
  userType?: string
}

export default function Home() {
  const router = useRouter()
  const [userStatus, setUserStatus] = useState<UserStatus>({ isLoggedIn: false })
  const [paymentEnabled, setPaymentEnabled] = useState(false)
  const [showWechatQR, setShowWechatQR] = useState(false)

  // 获取用户状态
  const fetchUserStatus = async () => {
    try {
      const response = await axios.get('/api/user/status')
      setUserStatus(response.data)
    } catch (error) {
      setUserStatus({ isLoggedIn: false })
    }
  }

  // 获取微信支付配置状态
  const fetchPaymentStatus = async () => {
    try {
      const response = await axios.get('/api/payment/config-status')
      setPaymentEnabled(response.data.data.paymentEnabled)
    } catch (error) {
      setPaymentEnabled(false)
    }
  }

  useEffect(() => {
    fetchUserStatus()
    fetchPaymentStatus()
  }, [])

  const handleStartAnalysis = () => {
    router.push('/tasks')
  }

  const handleUpgrade = () => {
    if (!userStatus.isLoggedIn) {
      router.push('/login')
    } else {
      router.push('/payment')
    }
  }

  const handleFreeTrial = () => {
    router.push('/tasks')
  }

  return (
    <>
      <Head>
        <title>FINC AI智能财报分析 - 专业财务数据洞察</title>
        <meta name="description" content="基于先进人工智能技术的专业财务数据分析平台，深度覆盖国内全市场上市公司" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen text-white" style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 25%, #0f3460 50%, #533483 75%, #7b2cbf 100%)'
      }}>
        <TopHeader />
        
        {/* 主横幅区域 */}
        <section className="relative overflow-hidden pt-16">
          <div style={{
            background: 'linear-gradient(135deg, rgba(26, 26, 46, 0.9) 0%, rgba(22, 33, 62, 0.8) 25%, rgba(15, 52, 96, 0.7) 50%, rgba(83, 52, 131, 0.8) 75%, rgba(123, 44, 191, 0.9) 100%)'
          }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
              <div className="text-center">
                <div className="animate-pulse">
                  <h1 className="text-6xl font-extrabold mb-6">
                    <span style={{
                      background: 'linear-gradient(135deg, #4ade80, #a78bfa, #38bdf8)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}>
                      FINC AI智能财报分析
                    </span>
                  </h1>
                </div>
                <p className="text-xl text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed">
                  基于先进人工智能技术的专业财务数据分析，深度覆盖国内全市场上市公司<br/>
                  提供智能化财报解读、精准风险评估、专业投资建议，助力每个投资者做出明智决策
                </p>
                <div className="flex justify-center">
                  <button 
                    onClick={handleStartAnalysis}
                    className="bg-gradient-to-r from-purple-600 to-green-600 hover:from-purple-700 hover:to-green-700 text-white font-bold py-3 px-8 rounded-full transition-all transform hover:scale-105"
                    style={{
                      boxShadow: '0 0 20px rgba(123, 44, 191, 0.3), 0 0 40px rgba(34, 197, 94, 0.2)'
                    }}
                  >
                    立即开始分析
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* 背景装饰 */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-green-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
            <div className="absolute top-1/3 left-1/4 w-32 h-32 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-15 animate-pulse"></div>
          </div>
        </section>

        {/* 核心优势 */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4" style={{
                background: 'linear-gradient(135deg, #4ade80, #a78bfa, #38bdf8)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                核心优势
              </h2>
              <p className="text-xl text-gray-300">专业级财务分析工具，助力投资决策</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* 深度财报分析 */}
              <div className="p-8 rounded-2xl border border-purple-500/30 hover:border-green-500/50 transition-all transform hover:-translate-y-2 hover:scale-105"
                style={{
                  background: 'linear-gradient(145deg, rgba(26, 26, 46, 0.8) 0%, rgba(83, 52, 131, 0.6) 50%, rgba(34, 197, 94, 0.4) 100%)',
                  boxShadow: '0 0 20px rgba(123, 44, 191, 0.3), 0 0 40px rgba(34, 197, 94, 0.2)'
                }}
              >
                <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-green-600 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">深度财报分析</h3>
                <p className="text-gray-300 leading-relaxed">
                  全面覆盖资产负债表、利润表、现金流量表三大核心财务报表，提供超过50项关键财务指标分析，包括盈利能力、偿债能力、运营效率、成长性等多维度评估，并结合杜邦分析法深度剖析企业财务结构与经营质量，为投资决策提供专业级数据支撑。
                </p>
              </div>

              {/* 丰富的报表数据 */}
              <div className="p-8 rounded-2xl border border-purple-500/30 hover:border-green-500/50 transition-all transform hover:-translate-y-2 hover:scale-105"
                style={{
                  background: 'linear-gradient(145deg, rgba(26, 26, 46, 0.8) 0%, rgba(83, 52, 131, 0.6) 50%, rgba(34, 197, 94, 0.4) 100%)',
                  boxShadow: '0 0 20px rgba(123, 44, 191, 0.3), 0 0 40px rgba(34, 197, 94, 0.2)'
                }}
              >
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path>
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">丰富的报表数据</h3>
                <p className="text-gray-300 leading-relaxed">
                  涵盖国内全市场4000+上市公司历史10年完整财务数据，包含资产负债表60+项目、利润表30+项目、现金流量表40+项目，以及重要财务比率和衍生指标，数据来源权威可靠，更新及时，确保分析结果的准确性和时效性。
                </p>
              </div>

              {/* 开放免费 */}
              <div className="p-8 rounded-2xl border border-purple-500/30 hover:border-green-500/50 transition-all transform hover:-translate-y-2 hover:scale-105"
                style={{
                  background: 'linear-gradient(145deg, rgba(26, 26, 46, 0.8) 0%, rgba(83, 52, 131, 0.6) 50%, rgba(34, 197, 94, 0.4) 100%)',
                  boxShadow: '0 0 20px rgba(123, 44, 191, 0.3), 0 0 40px rgba(34, 197, 94, 0.2)'
                }}
              >
                <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-purple-600 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">开放免费</h3>
                <p className="text-gray-300 leading-relaxed">
                  打破传统财务分析工具的高门槛限制，免费提供基础财务分析功能，包括完整的财报数据查看、核心财务指标计算、基础AI分析建议等，让每个投资者都能享受专业级的财务分析服务，降低投资决策成本，实现财务分析民主化。
                </p>
              </div>

              {/* 微信扫码登录 */}
              <div className="p-8 rounded-2xl border border-purple-500/30 hover:border-green-500/50 transition-all transform hover:-translate-y-2 hover:scale-105"
                style={{
                  background: 'linear-gradient(145deg, rgba(26, 26, 46, 0.8) 0%, rgba(83, 52, 131, 0.6) 50%, rgba(34, 197, 94, 0.4) 100%)',
                  boxShadow: '0 0 20px rgba(123, 44, 191, 0.3), 0 0 40px rgba(34, 197, 94, 0.2)'
                }}
              >
                <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-green-600 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">微信扫码登录</h3>
                <p className="text-gray-300 leading-relaxed">
                  采用最便捷的微信扫码登录方式，无需复杂的注册流程和记忆密码，一键即可快速进入系统开始财务分析。安全可靠的身份验证机制，保护用户数据隐私，让专业财务分析触手可及，随时随地进行投资研究。
                </p>
              </div>

              {/* AI智能分析 */}
              <div className="p-8 rounded-2xl border border-purple-500/30 hover:border-green-500/50 transition-all transform hover:-translate-y-2 hover:scale-105"
                style={{
                  background: 'linear-gradient(145deg, rgba(26, 26, 46, 0.8) 0%, rgba(83, 52, 131, 0.6) 50%, rgba(34, 197, 94, 0.4) 100%)',
                  boxShadow: '0 0 20px rgba(123, 44, 191, 0.3), 0 0 40px rgba(34, 197, 94, 0.2)'
                }}
              >
                <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-purple-600 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">AI智能分析</h3>
                <p className="text-gray-300 leading-relaxed">
                  运用先进的人工智能算法，基于海量历史数据和行业基准，提供智能化的财务数据解读、趋势预测、风险预警和投资建议。AI能够识别财务数据中的关键模式和异常信号，结合行业特点进行专业级分析洞察，为投资决策提供科学依据。
                </p>
              </div>

              {/* 极致性价比 */}
              <div className="p-8 rounded-2xl border border-purple-500/30 hover:border-green-500/50 transition-all transform hover:-translate-y-2 hover:scale-105"
                style={{
                  background: 'linear-gradient(145deg, rgba(26, 26, 46, 0.8) 0%, rgba(83, 52, 131, 0.6) 50%, rgba(34, 197, 94, 0.4) 100%)',
                  boxShadow: '0 0 20px rgba(123, 44, 191, 0.3), 0 0 40px rgba(34, 197, 94, 0.2)'
                }}
              >
                <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-green-600 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">极致性价比</h3>
                <p className="text-gray-300 leading-relaxed">
                  专业版提供多种套餐选择：1个月¥12、3个月¥30、6个月¥60、12个月¥100，相比市场同类产品节省80%以上成本。提供50个分析任务额度、完整的分项AI建议、深度行业对比分析、10年历史数据图表等高级功能，让每个投资者都能以最低成本享受机构级财务分析服务。
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 版本对比 - 只有在微信支付开启时才显示 */}
        {paymentEnabled && (
          <section className="py-20 bg-black bg-opacity-40">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold mb-4" style={{
                  background: 'linear-gradient(135deg, #4ade80, #a78bfa, #38bdf8)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  版本对比
                </h2>
                <p className="text-xl text-gray-300">选择适合您的分析套餐</p>
              </div>
              
              <div className="bg-gradient-to-r from-purple-900/40 to-green-900/40 rounded-2xl border border-purple-500/30 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-purple-800/50 to-green-800/50">
                        <th className="px-6 py-4 text-left text-lg font-bold text-white">功能特性</th>
                        <th className="px-6 py-4 text-center text-lg font-bold text-white">免费版</th>
                        <th className="px-6 py-4 text-center text-lg font-bold text-white">专家版</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-500/20">
                      <tr className="hover:bg-purple-500/10 transition-all">
                        <td className="px-6 py-4 text-gray-300 font-medium">分析任务数量</td>
                        <td className="px-6 py-4 text-center text-yellow-400">2个任务</td>
                        <td className="px-6 py-4 text-center text-green-400">50个任务</td>
                      </tr>
                      <tr className="hover:bg-purple-500/10 transition-all">
                        <td className="px-6 py-4 text-gray-300 font-medium">财报列表查看</td>
                        <td className="px-6 py-4 text-center text-green-400">✓</td>
                        <td className="px-6 py-4 text-center text-green-400">✓</td>
                      </tr>
                      <tr className="hover:bg-purple-500/10 transition-all">
                        <td className="px-6 py-4 text-gray-300 font-medium">财务指标分析</td>
                        <td className="px-6 py-4 text-center text-green-400">✓</td>
                        <td className="px-6 py-4 text-center text-green-400">✓</td>
                      </tr>
                      <tr className="hover:bg-purple-500/10 transition-all">
                        <td className="px-6 py-4 text-gray-300 font-medium">总体AI建议</td>
                        <td className="px-6 py-4 text-center text-green-400">✓</td>
                        <td className="px-6 py-4 text-center text-green-400">✓</td>
                      </tr>
                      <tr className="hover:bg-purple-500/10 transition-all">
                        <td className="px-6 py-4 text-gray-300 font-medium">分项AI详细分析</td>
                        <td className="px-6 py-4 text-center text-red-400">✗</td>
                        <td className="px-6 py-4 text-center text-green-400">✓</td>
                      </tr>
                      <tr className="hover:bg-purple-500/10 transition-all">
                        <td className="px-6 py-4 text-gray-300 font-medium">行业对比分析</td>
                        <td className="px-6 py-4 text-center text-red-400">✗</td>
                        <td className="px-6 py-4 text-center text-green-400">✓</td>
                      </tr>
                      <tr className="hover:bg-purple-500/10 transition-all">
                        <td className="px-6 py-4 text-gray-300 font-medium">历史趋势图表</td>
                        <td className="px-6 py-4 text-center text-yellow-400">3年数据</td>
                        <td className="px-6 py-4 text-center text-green-400">10年数据</td>
                      </tr>
                      <tr className="hover:bg-purple-500/10 transition-all">
                        <td className="px-6 py-4 text-gray-300 font-medium">价格</td>
                        <td className="px-6 py-4 text-center text-green-400 font-bold">免费</td>
                        <td className="px-6 py-4 text-center">
                          <div className="text-green-400 font-bold text-sm mb-1">1个月 ¥12</div>
                          <div className="text-green-400 font-bold text-sm mb-1">3个月 ¥30</div>  
                          <div className="text-green-400 font-bold text-sm mb-1">6个月 ¥60</div>
                          <div className="text-green-400 font-bold text-sm">12个月 ¥100</div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="text-center mt-8">
                <button 
                  onClick={handleUpgrade}
                  className="bg-gradient-to-r from-purple-600 to-green-600 hover:from-purple-700 hover:to-green-700 text-white font-bold py-3 px-8 rounded-full transition-all mr-4"
                  style={{
                    boxShadow: '0 0 20px rgba(123, 44, 191, 0.3), 0 0 40px rgba(34, 197, 94, 0.2)'
                  }}
                >
                  升级专家版
                </button>
                <button 
                  onClick={handleFreeTrial}
                  className="border-2 border-gray-500 text-gray-300 hover:bg-gray-500 hover:text-white font-bold py-3 px-8 rounded-full transition-all"
                >
                  免费试用
                </button>
              </div>
            </div>
          </section>
        )}

        {/* 微信支付未开启时，只显示免费试用按钮 */}
        {!paymentEnabled && (
          <section className="py-20 bg-black bg-opacity-40">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <h2 className="text-4xl font-bold mb-4" style={{
                  background: 'linear-gradient(135deg, #4ade80, #a78bfa, #38bdf8)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  开始您的财报分析之旅
                </h2>
                <p className="text-xl text-gray-300 mb-8">免费体验专业级财务数据分析服务</p>
                
                <button 
                  onClick={handleFreeTrial}
                  className="bg-gradient-to-r from-purple-600 to-green-600 hover:from-purple-700 hover:to-green-700 text-white font-bold py-4 px-12 rounded-full transition-all text-lg"
                  style={{
                    boxShadow: '0 0 20px rgba(123, 44, 191, 0.3), 0 0 40px rgba(34, 197, 94, 0.2)'
                  }}
                >
                  免费试用
                </button>
              </div>
            </div>
          </section>
        )}

        {/* 页脚 */}
        <footer className="bg-black bg-opacity-60 border-t border-purple-500/30 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="text-2xl font-bold mb-4" style={{
                background: 'linear-gradient(135deg, #4ade80, #a78bfa, #38bdf8)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                FINC AI智能财报分析
              </div>
              <p className="text-gray-400 mb-4">专业的财务数据分析，智能的投资决策支持</p>
              <div className="flex justify-center space-x-6 text-sm text-gray-500">
              </div>
              <div className="flex justify-center items-center space-x-4 text-sm text-gray-600 mt-4">
                <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">备案号：浙ICP备2025180064号-1</a>
                <span>|</span>
                <button onClick={() => setShowWechatQR(true)} className="hover:text-gray-400 transition-colors">联系我们</button>
              </div>
            </div>
          </div>
        </footer>

        {/* 微信二维码弹框 */}
        {showWechatQR && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowWechatQR(false)}>
            <div className="bg-white rounded-lg p-8 max-w-md mx-4 relative" onClick={(e) => e.stopPropagation()}>
              <button 
                onClick={() => setShowWechatQR(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-800 mb-4">添加客服微信</h3>
                <img 
                  src="/wechat-qr.jpg" 
                  alt="微信二维码" 
                  className="w-64 h-64 mx-auto rounded-lg shadow-lg"
                />
                <p className="text-gray-600 mt-4">扫描二维码添加客服微信</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
} 