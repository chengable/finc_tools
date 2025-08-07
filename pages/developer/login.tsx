import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import axios from 'axios'

interface LoginForm {
  username: string
  password: string
  authKey: string
  captcha: string
}

export default function AdminLogin() {
  const router = useRouter()
  const [form, setForm] = useState<LoginForm>({
    username: '',
    password: '',
    authKey: '',
    captcha: ''
  })
  const [captchaUrl, setCaptchaUrl] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // 获取验证码
  const refreshCaptcha = async () => {
    try {
      const response = await axios.get('/api/captcha/generate')
      
      if (response.data.success) {
        setSessionId(response.data.sessionId)
        setCaptchaUrl(response.data.image)
      } else {
        console.error('获取验证码失败:', response.data.message)
      }
    } catch (error) {
      console.error('获取验证码失败:', error)
    }
  }

  // 初始化验证码
  useEffect(() => {
    refreshCaptcha()
  }, [])

  // 检查登录状态
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const response = await axios.get('/api/user/status')
        if (response.data.isLoggedIn) {
          if (response.data.userType === 'admin') {
            router.push('/admin')
          } else {
            router.push('/')
          }
        }
      } catch (error) {
        // 未登录，继续显示登录页面
      }
    }
    
    checkLoginStatus()
  }, [router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await axios.post('/api/admin/login', {
        ...form,
        sessionId
      })

      // 登录成功，跳转到首页
      router.push('/')
    } catch (error: any) {
      setError(error.response?.data?.message || '登录失败')
      // 刷新验证码
      refreshCaptcha()
      setForm(prev => ({ ...prev, captcha: '' }))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>管理员登录 - AI财报分析</title>
      </Head>
      
      <div className="min-h-screen text-white" style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 25%, #0f3460 50%, #533483 75%, #7b2cbf 100%)'
      }}>
        {/* 背景装饰 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-green-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-800 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
        </div>

        {/* 登录卡片 */}
        <div className="relative z-10 w-full max-w-md px-6 mx-auto pt-20 min-h-screen flex flex-col justify-center">
          {/* 返回首页按钮 */}
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center text-gray-300 hover:text-white transition-colors">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
              </svg>
              返回首页
            </Link>
          </div>

          {/* 登录表单 */}
          <div className="p-8 rounded-2xl border border-purple-500/30" style={{
            background: 'linear-gradient(145deg, rgba(26, 26, 46, 0.8) 0%, rgba(83, 52, 131, 0.6) 50%, rgba(34, 197, 94, 0.4) 100%)',
            boxShadow: '0 0 20px rgba(123, 44, 191, 0.3), 0 0 40px rgba(34, 197, 94, 0.2)'
          }}>
            {/* 标题 */}
            <div className="text-center mb-8">
              <div className="animate-pulse">
                <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                  </svg>
                </div>
              </div>
              <h1 className="text-3xl font-bold mb-2" style={{
                background: 'linear-gradient(135deg, #22c55e, #7c3aed, #06b6d4)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                管理员登录
              </h1>
              <p className="text-gray-300">AI财报分析 - 后台管理系统</p>
            </div>

            {/* 错误信息 */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-red-400 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* 登录表单 */}
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* 用户名 */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                  <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                  用户名
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  required
                  className="w-full px-4 py-3 rounded-lg text-white placeholder-gray-400 focus:outline-none transition-all border focus:border-green-500/60"
                  style={{
                    background: 'linear-gradient(145deg, rgba(26, 26, 46, 0.6) 0%, rgba(83, 52, 131, 0.4) 100%)',
                    border: '1px solid rgba(123, 44, 191, 0.3)'
                  }}
                  placeholder="请输入管理员用户名"
                  value={form.username}
                  onChange={handleInputChange}
                />
              </div>

              {/* 密码 */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                  </svg>
                  密码
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  required
                  className="w-full px-4 py-3 rounded-lg text-white placeholder-gray-400 focus:outline-none transition-all border focus:border-green-500/60"
                  style={{
                    background: 'linear-gradient(145deg, rgba(26, 26, 46, 0.6) 0%, rgba(83, 52, 131, 0.4) 100%)',
                    border: '1px solid rgba(123, 44, 191, 0.3)'
                  }}
                  placeholder="请输入密码"
                  value={form.password}
                  onChange={handleInputChange}
                />
              </div>

              {/* 验证码 */}
              <div>
                <label htmlFor="captcha" className="block text-sm font-medium text-gray-300 mb-2">
                  <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  图片验证码
                </label>
                <div className="flex space-x-3">
                  <input
                    type="text"
                    id="captcha"
                    name="captcha"
                    required
                    className="flex-1 px-4 py-3 rounded-lg text-white placeholder-gray-400 focus:outline-none transition-all border focus:border-green-500/60"
                    style={{
                      background: 'linear-gradient(145deg, rgba(26, 26, 46, 0.6) 0%, rgba(83, 52, 131, 0.4) 100%)',
                      border: '1px solid rgba(123, 44, 191, 0.3)'
                    }}
                    placeholder="请输入验证码"
                    value={form.captcha}
                    onChange={handleInputChange}
                  />
                  <div className="w-28 h-12 bg-gradient-to-r from-purple-600 to-green-600 rounded-lg flex items-center justify-center cursor-pointer hover:from-purple-700 hover:to-green-700 transition-all relative overflow-hidden"
                    onClick={refreshCaptcha}
                  >
                    {captchaUrl ? (
                      <img 
                        src={captchaUrl} 
                        className="w-full h-full object-cover rounded-lg" 
                        alt="验证码"
                      />
                    ) : (
                      <span className="text-white font-bold text-sm tracking-wider animate-pulse">加载中...</span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-1">点击验证码图片可刷新</p>
                <p className="text-xs text-green-400 mt-1">💡 提示：请输入图片中显示的4位数字验证码</p>
              </div>

              {/* AUTH KEY */}
              <div>
                <label htmlFor="authKey" className="block text-sm font-medium text-gray-300 mb-2">
                  <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
                  </svg>
                  AUTH KEY
                </label>
                <input
                  type="password"
                  id="authKey"
                  name="authKey"
                  required
                  className="w-full px-4 py-3 rounded-lg text-white placeholder-gray-400 focus:outline-none transition-all border focus:border-green-500/60"
                  style={{
                    background: 'linear-gradient(145deg, rgba(26, 26, 46, 0.6) 0%, rgba(83, 52, 131, 0.4) 100%)',
                    border: '1px solid rgba(123, 44, 191, 0.3)'
                  }}
                  placeholder="请输入管理员认证密钥"
                  value={form.authKey}
                  onChange={handleInputChange}
                />
                <p className="text-xs text-gray-400 mt-1">请输入系统分配的管理员认证密钥</p>
              </div>

              {/* 登录按钮 */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-green-600 hover:from-purple-700 hover:to-green-700 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  boxShadow: '0 0 20px rgba(123, 44, 191, 0.3), 0 0 40px rgba(34, 197, 94, 0.2)'
                }}
              >
                {loading ? (
                  <>
                    <svg className="w-5 h-5 inline mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                    </svg>
                    登录中...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
                    </svg>
                    立即登录
                  </>
                )}
              </button>



              {/* 安全提示 */}
              <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-yellow-400 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0L4.18 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                  </svg>
                  <div>
                    <p className="text-yellow-400 text-sm font-medium">安全提示</p>
                    <p className="text-yellow-300 text-xs mt-1">请确保您是授权的管理员用户，登录信息将被记录用于安全审计。</p>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* 页脚信息 */}
          <div className="text-center mt-6 text-gray-400 text-sm">
            <p><a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">备案号：浙ICP备2025180064号-1</a></p>
            <p className="mt-1">如遇登录问题，请联系系统管理员</p>
          </div>
        </div>
      </div>
    </>
  )
} 