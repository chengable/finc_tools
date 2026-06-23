import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import TopHeader from '../components/TopHeader'

export default function WechatLogin() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 处理微信登录
  const handleWechatLogin = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/auth/wechat/qrcode')
      const data = await response.json()
      
      if (data.success && data.data?.authUrl) {
        // 直接跳转到微信登录URL
        window.location.href = data.data.authUrl
      } else {
        setError(data.message || '获取登录链接失败')
      }
    } catch (error) {
      console.error('获取微信登录链接失败:', error)
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 处理URL中的登录结果
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const token = urlParams.get('token')
    const error = urlParams.get('error')
    
    if (token) {
      // 登录成功，保存token并跳转
      localStorage.setItem('token', token)
      router.push('/tasks')
    } else if (error) {
      setError(decodeURIComponent(error))
    }
  }, [router])

  return (
    <>
      <Head>
        <title>微信登录 - FINC AI智能财报分析平台</title>
        <meta name="description" content="使用微信账号快速登录FINC AI智能财报分析平台，享受专业的财务数据分析服务，开启您的投资决策之旅。" />
        <meta name="keywords" content="微信登录,财报分析,AI分析,投资决策,财务数据,用户登录" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="微信登录 - FINC AI智能财报分析平台" />
        <meta property="og:description" content="使用微信账号快速登录FINC AI智能财报分析平台，享受专业的财务数据分析服务。" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${process.env.NEXT_PUBLIC_SITE_URL || ''}/login`} />
        {/* 微博分享优化 */}
        <meta property="weibo:webpage:create_at" content="1735027200" />
        <meta property="weibo:webpage:update_at" content={Math.floor(Date.now() / 1000).toString()} />
        <meta name="baidu-site-verification" content="codeva-finc-login" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link rel="canonical" href={`${process.env.NEXT_PUBLIC_SITE_URL || ''}/login`} />
        <style jsx>{`
          .wechat-login-btn:hover:not(:disabled) {
            background-color: #059652 !important;
          }
        `}</style>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* 顶部导航栏 */}
        <TopHeader />
        
        {/* 背景装饰 */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse" style={{left: '20%', top: '20%', animationDelay: '0s'}}></div>
          <div className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse" style={{left: '40%', top: '40%', animationDelay: '4s'}}></div>
          <div className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse" style={{left: '60%', top: '60%', animationDelay: '8s'}}></div>
          <div className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse" style={{left: '80%', top: '80%', animationDelay: '12s'}}></div>
          <div className="absolute w-1 h-1 bg-purple-400/20 rounded-full animate-bounce" style={{left: '30%', top: '30%', animationDelay: '2s'}}></div>
          <div className="absolute w-1 h-1 bg-green-400/20 rounded-full animate-bounce" style={{left: '70%', top: '70%', animationDelay: '6s'}}></div>
        </div>

        {/* 主内容 */}
        <div className="relative z-10 min-h-screen flex items-center justify-center pt-20 pb-12 px-4">
          <div className="w-full max-w-md">
            <div className="bg-white/95 backdrop-blur-sm p-8 rounded-2xl border border-gray-200 shadow-2xl">
              {/* 头部标题 */}
              <div className="text-center mb-8">
                <div className="mb-4">
                  <div className="w-16 h-16 flex items-center justify-center mx-auto">
                    <img src="/wechat-logo-svgrepo-com.svg" alt="微信" className="w-16 h-16" />
                  </div>
                </div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  微信登录
                </h1>
                <p className="text-gray-600">使用微信账号，开启您的财务分析之旅</p>
              </div>

              {/* 登录按钮 */}
              <div className="space-y-4">
                <button
                  onClick={handleWechatLogin}
                  disabled={loading}
                  className="w-full disabled:bg-gray-500 disabled:cursor-not-allowed text-white py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 flex items-center justify-center wechat-login-btn"
                  style={{
                    backgroundColor: loading ? '#6b7280' : '#07C160'
                  }}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      正在跳转...
                    </>
                                      ) : (
                      '微信登录'
                    )}
                </button>

                {/* 错误提示 */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm text-center">
                    {error}
                  </div>
                )}
              </div>

              {/* 底部说明 */}
              <div className="mt-8 text-center">
                <p className="text-sm text-gray-500 mb-2">
                  点击登录按钮将跳转到微信授权页面
                </p>
                <p className="text-xs text-gray-400">
                  登录即表示您同意我们的服务条款和隐私政策
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}