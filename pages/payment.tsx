import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Image from 'next/image'
import TopHeader from '../components/TopHeader'

interface PaymentOrder {
  orderId: string
  qrCode: string
  qrCodeImage?: string
  amount: number
  paymentType: '1_month' | '3_month' | '6_month' | '12_month'
  description: string
}

interface PaymentStatus {
  orderId: string
  status: 'pending' | 'paid' | 'failed' | 'expired'
  needRefresh?: boolean
  paidTime?: string
  amount?: number
  paymentType?: string
}

interface User {
  id: string
  username: string
  userType: 'free' | 'premium'
  nickname?: string
}

export default function Payment() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [qrLoading, setQrLoading] = useState(false)
  const [paymentType, setPaymentType] = useState<'1_month' | '3_month' | '6_month' | '12_month'>('1_month')
  const [currentOrder, setCurrentOrder] = useState<PaymentOrder | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null)
  const [qrExpired, setQrExpired] = useState(false)
  const [statusMessage, setStatusMessage] = useState('等待支付')
  const [statusPolling, setStatusPolling] = useState<NodeJS.Timeout | null>(null)
  const [showWechatQR, setShowWechatQR] = useState(false)

  // 检查用户状态和权限
  useEffect(() => {
    checkUserPermission()
  }, [])

  // 智能轮询支付状态（双保险：回调 + 轮询）
  useEffect(() => {
    if (currentOrder && paymentStatus?.status === 'pending') {
      let pollCount = 0
      const maxPollCount = 200 // 最多轮询200次（约16分钟）
      
      const interval = setInterval(() => {
        pollCount++
        
        // 前2分钟每3秒查询一次，之后每5秒查询一次
        const currentInterval = pollCount < 40 ? 3000 : 5000
        
        checkPaymentStatus(currentOrder.orderId)
        
        // 达到最大轮询次数后停止
        if (pollCount >= maxPollCount) {
          if (statusPolling) {
            clearInterval(statusPolling)
            setStatusPolling(null)
          }
          setStatusMessage('请刷新页面检查支付状态')
        }
      }, 3000) // 初始间隔3秒
      
      setStatusPolling(interval)
      
      return () => {
        if (interval) clearInterval(interval)
      }
    } else if (statusPolling) {
      clearInterval(statusPolling)
      setStatusPolling(null)
    }
  }, [currentOrder, paymentStatus])

  // 当付费类型变化时自动生成二维码
  useEffect(() => {
    if (user && !loading) {
      // 清除之前的订单状态
      setCurrentOrder(null)
      setPaymentStatus(null)
      setQrExpired(false)
      
      // 防抖延迟调用
      const timer = setTimeout(() => {
        createPaymentOrder()
      }, 300)
      
      return () => clearTimeout(timer)
    }
  }, [paymentType, user])

  const checkUserPermission = async () => {
    try {
      const response = await fetch('/api/user/status', {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('获取用户状态失败')
      }
      
      const result = await response.json()
      
      // 检查是否已登录
      if (!result.isLoggedIn) {
        router.push('/login')
        return
      }
      
      const userData = result.user
      
      // 权限检查：任何已登录用户都可以访问支付页面来续费
      setUser(userData)
      setLoading(false)
    } catch (error) {
      router.push('/login')
    }
  }

  const createPaymentOrder = async () => {
    try {
      setQrLoading(true)
      setStatusMessage('生成二维码中...')
      
      const response = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ paymentType })
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }
      
      const result = await response.json()
      
      if (!result.success) {
        setStatusMessage('生成失败，请刷新重试')
        setQrLoading(false)
        return
      }
      
      setCurrentOrder(result.data)
      setPaymentStatus({
        orderId: result.data.orderId,
        status: 'pending'
      })
      setQrExpired(false)
      setStatusMessage('等待支付')
      setQrLoading(false)
      
    } catch (error) {
      setStatusMessage('网络错误，请稍后重试')
      setQrLoading(false)
    }
  }

  const checkPaymentStatus = async (orderId: string) => {
    try {
      const response = await fetch(`/api/payment/query-status?orderId=${orderId}`, {
        credentials: 'include'
      })
      
      if (!response.ok) {
        return
      }
      
      const result = await response.json()
      
      if (result.success) {
        const status = result.data
        setPaymentStatus(status)
        
        if (status.needRefresh) {
          setQrExpired(true)
          setStatusMessage('二维码已过期')
        } else {
          switch (status.status) {
            case 'pending':
              setStatusMessage('等待支付中...')
              break
            case 'paid':
              setStatusMessage('✅ 支付成功！正在为您升级账户...')
              
              // 立即清除轮询
              if (statusPolling) {
                clearInterval(statusPolling)
                setStatusPolling(null)
              }
              
              // 显示成功消息并跳转
              setTimeout(() => {
                setStatusMessage('✅ 账户升级完成，即将跳转...')
              }, 1000)
              
              setTimeout(() => {
                window.location.href = '/' // 使用 window.location.href 确保完全刷新
              }, 2500)
              break
            case 'failed':
              setStatusMessage('❌ 支付失败，请重试')
              // 清除轮询
              if (statusPolling) {
                clearInterval(statusPolling)
                setStatusPolling(null)
              }
              break
            case 'expired':
              setStatusMessage('⏰ 订单已过期')
              setQrExpired(true)
              // 清除轮询
              if (statusPolling) {
                clearInterval(statusPolling)
                setStatusPolling(null)
              }
              break
          }
        }
      }
    } catch (error) {
      // 查询支付状态异常，忽略错误继续轮询
    }
  }

  const refreshQrCode = () => {
    setCurrentOrder(null)
    setPaymentStatus(null)
    setQrExpired(false)
    if (statusPolling) {
      clearInterval(statusPolling)
      setStatusPolling(null)
    }
    createPaymentOrder()
  }

  const getPaymentPrice = () => {
    switch (paymentType) {
      case '1_month':
        return { primary: '1个月 ¥12', secondary: '', desc: '单月套餐，到期后需重新购买' }
      case '3_month':
        return { primary: '3个月 ¥30', secondary: '', desc: '三月套餐，平均每月¥10' }
      case '6_month':
        return { primary: '6个月 ¥60', secondary: '', desc: '六月套餐，平均每月¥10' }
      case '12_month':
        return { primary: '12个月 ¥100', secondary: '', desc: '年度套餐，平均每月¥8.3' }
      default:
        return { primary: '1个月 ¥12', secondary: '', desc: '单月套餐，到期后需重新购买' }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 via-blue-900 to-green-900 flex items-center justify-center">
        <div className="text-white text-xl">加载中...</div>
      </div>
    )
  }

  const priceInfo = getPaymentPrice()

  return (
    <>
      <Head>
        <title>开通专家版 - FINC AI智能财报分析</title>
        <meta name="description" content="升级专家版，解锁完整的专业级财务分析功能" />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-purple-900 via-blue-900 to-green-900 text-white">
        {/* 顶部导航 */}
        <TopHeader />

        {/* 背景装饰 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-green-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute top-1/3 left-1/4 w-32 h-32 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-15 animate-bounce"></div>
          
          {/* 粒子效果 */}
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-2 h-2 bg-white/10 rounded-full animate-pulse`}
              style={{
                left: `${10 + i * 10}%`,
                animationDelay: `${i * 2}s`,
                top: `${20 + Math.random() * 60}%`
              }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12">
          {/* 页面标题 */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 via-purple-400 to-blue-400 bg-clip-text text-transparent mb-4">
              开通专家版
            </h1>
            <p className="text-xl text-gray-300">升级专家版，解锁完整的专业级财务分析功能</p>
          </div>

          {/* 主要内容区域 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* 左侧版本对比 */}
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-green-400 via-purple-400 to-blue-400 bg-clip-text text-transparent mb-4">
                  版本对比
                </h2>
                <p className="text-lg text-gray-300">选择适合您的分析套餐</p>
              </div>
              
              <div className="bg-gradient-to-r from-purple-900/40 to-green-900/40 rounded-2xl border border-purple-500/30 overflow-hidden shadow-2xl">
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
            </div>
            
            {/* 右侧付费区域 */}
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-green-400 via-purple-400 to-blue-400 bg-clip-text text-transparent mb-4">
                  立即开通
                </h2>
                <p className="text-lg text-gray-300">扫码支付，即刻享受专业服务</p>
              </div>
              
              <div className="bg-gradient-to-r from-purple-900/40 to-green-900/40 rounded-2xl border border-purple-500/30 shadow-2xl overflow-hidden">
                <div className="p-8">
                  {/* 付费方式选择标签 */}
                  <div className="grid grid-cols-2 gap-2 mb-8">
                    <button
                      onClick={() => setPaymentType('1_month')}
                      className={`py-3 px-4 rounded-xl font-bold transition-all ${
                        paymentType === '1_month' 
                          ? 'bg-gradient-to-r from-green-400 to-purple-400 text-white transform scale-102' 
                          : 'bg-purple-800/30 text-gray-300 hover:bg-purple-700/40'
                      }`}
                    >
                      1个月
                    </button>
                    <button
                      onClick={() => setPaymentType('3_month')}
                      className={`py-3 px-4 rounded-xl font-bold transition-all ${
                        paymentType === '3_month' 
                          ? 'bg-gradient-to-r from-green-400 to-purple-400 text-white transform scale-102' 
                          : 'bg-purple-800/30 text-gray-300 hover:bg-purple-700/40'
                      }`}
                    >
                      3个月
                    </button>
                    <button
                      onClick={() => setPaymentType('6_month')}
                      className={`py-3 px-4 rounded-xl font-bold transition-all ${
                        paymentType === '6_month' 
                          ? 'bg-gradient-to-r from-green-400 to-purple-400 text-white transform scale-102' 
                          : 'bg-purple-800/30 text-gray-300 hover:bg-purple-700/40'
                      }`}
                    >
                      6个月
                    </button>
                    <button
                      onClick={() => setPaymentType('12_month')}
                      className={`py-3 px-4 rounded-xl font-bold transition-all ${
                        paymentType === '12_month' 
                          ? 'bg-gradient-to-r from-green-400 to-purple-400 text-white transform scale-102' 
                          : 'bg-purple-800/30 text-gray-300 hover:bg-purple-700/40'
                      }`}
                    >
                      12个月
                    </button>
                  </div>
                  
                  {/* 价格显示 */}
                  <div className="text-center mb-6">
                    <div className="flex items-center justify-center space-x-3 mb-2">
                      {priceInfo.secondary && (
                        <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold text-lg px-4 py-1 rounded-2xl shadow-lg">
                          {priceInfo.primary}
                        </div>
                      )}
                      <div className="text-green-400 font-bold text-lg">
                        {priceInfo.secondary || priceInfo.primary}
                      </div>
                    </div>
                    <div className="text-sm text-gray-400">{priceInfo.desc}</div>
                  </div>
                  
                  {/* 微信扫码区域 */}
                  <div className="text-center mb-6">
                    <div className="flex items-center justify-center mb-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center mr-2">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8.5 4C5.5 4 3 6 3 8.5c0 1.5.8 2.8 2 3.5L4.5 14l2.5-1.5c.5.1 1 .1 1.5.1C10.5 12.6 12 10.6 12 8.5 12 6 9.5 4 8.5 4zM7 7.5c-.3 0-.5-.2-.5-.5s.2-.5.5-.5.5.2.5.5-.2.5-.5.5zm3 0c-.3 0-.5-.2-.5-.5s.2-.5.5-.5.5.2.5.5-.2.5-.5.5zM15.5 10c-3 0-5.5 2-5.5 4.5 0 1.5.8 2.8 2 3.5L11.5 20l2.5-1.5c.5.1 1 .1 1.5.1 3 0 5.5-2 5.5-4.5S18.5 10 15.5 10zM14 16c-.3 0-.5-.2-.5-.5s.2-.5.5-.5.5.2.5.5-.2.5-.5.5zm3 0c-.3 0-.5-.2-.5-.5s.2-.5.5-.5.5.2.5.5-.2.5-.5.5z"/>
                        </svg>
                      </div>
                      <span className="text-lg font-bold text-white">微信扫码支付</span>
                    </div>
                    
                    {/* 二维码区域 */}
                    <div className="relative">
                      <div className="bg-white rounded-xl p-3 inline-block relative">
                        {currentOrder?.qrCodeImage ? (
                          <div className="relative">
                            <Image
                              src={currentOrder.qrCodeImage}
                              alt="微信支付二维码"
                              width={150}
                              height={150}
                              className="rounded-lg"
                            />
                            {/* 过期蒙版 */}
                            {qrExpired && (
                              <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center">
                                <button
                                  onClick={refreshQrCode}
                                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-bold transition-all"
                                >
                                  刷新二维码
                                </button>
                              </div>
                            )}
                          </div>
                        ) : currentOrder?.qrCode ? (
                          <div className="w-36 h-36 bg-yellow-100 rounded-lg flex items-center justify-center">
                            <div className="flex flex-col items-center text-center p-2">
                              <svg className="w-8 h-8 text-yellow-600 mb-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              <span className="text-yellow-700 text-xs font-medium">二维码生成失败</span>
                              <button 
                                onClick={refreshQrCode}
                                className="text-yellow-600 text-xs underline mt-1"
                              >
                                重新生成
                              </button>
                            </div>
                          </div>
                        ) : qrLoading ? (
                          <div className="w-36 h-36 bg-gray-100 rounded-lg flex items-center justify-center">
                            <div className="flex flex-col items-center">
                              <svg className="animate-spin h-8 w-8 text-purple-600 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span className="text-gray-600 text-sm font-medium">生成中...</span>
                            </div>
                          </div>
                        ) : (
                          <div className="w-36 h-36 bg-yellow-100 rounded-lg flex items-center justify-center">
                            <div className="flex flex-col items-center text-center p-2">
                              <svg className="w-8 h-8 text-yellow-600 mb-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              <span className="text-yellow-700 text-xs font-medium">等待生成二维码</span>
                              <button 
                                onClick={refreshQrCode}
                                className="text-yellow-600 text-xs underline mt-1"
                              >
                                点击生成
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* 状态显示 */}
                    <div className="text-center mt-4">
                      <div className={`inline-flex items-center mb-1 ${
                        paymentStatus?.status === 'paid' ? 'text-green-400' :
                        paymentStatus?.status === 'failed' ? 'text-red-400' :
                        paymentStatus?.status === 'expired' || qrExpired ? 'text-yellow-400' :
                        'text-blue-400'
                      }`}>
                        <div className={`w-2 h-2 rounded-full mr-2 animate-pulse ${
                          paymentStatus?.status === 'paid' ? 'bg-green-400' :
                          paymentStatus?.status === 'failed' ? 'bg-red-400' :
                          paymentStatus?.status === 'expired' || qrExpired ? 'bg-yellow-400' :
                          'bg-blue-400'
                        }`}></div>
                        <span>{statusMessage}</span>
                      </div>
                      <p className="text-sm text-gray-400">
                        {paymentStatus?.status === 'paid' ? '即将跳转到首页...' : '使用微信扫一扫完成支付'}
                      </p>
                    </div>
                  </div>
                  
                  {/* 支付保障 */}
                  <div className="border-t border-purple-500/30 pt-6">
                    <div className="flex items-center justify-center space-x-6 text-sm text-gray-400">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                        </svg>
                        安全支付
                      </div>
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                        </svg>
                        即时开通
                      </div>
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                        </svg>
                        随时取消
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 页脚 */}
        <footer className="bg-black bg-opacity-60 border-t border-purple-500/30 py-12 mt-20">
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