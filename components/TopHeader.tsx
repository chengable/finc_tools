import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import axios from 'axios'

// 扩展 Window 类型以支持百度统计
declare global {
  interface Window {
    _hmt: any[]
  }
}

interface UserStatus {
  isLoggedIn: boolean
  userType?: 'admin' | 'free' | 'premium'
  user?: {
    id: number
    username?: string
    nickname?: string
    avatar?: string
    remainingDays?: number
  }
}

export default function TopHeader() {
  const router = useRouter()
  const [userStatus, setUserStatus] = useState<UserStatus>({ isLoggedIn: false })
  const [showDropdown, setShowDropdown] = useState(false)
  const [paymentEnabled, setPaymentEnabled] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // 设置页面标题和图标
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 设置页面标题
      document.title = 'FINC AI智能财报分析'
      
      // 设置 favicon
      const setFavicon = (href: string, type: string) => {
        let link = document.querySelector(`link[rel*='icon'][type='${type}']`) as HTMLLinkElement
        if (!link) {
          link = document.createElement('link')
          link.rel = 'icon'
          link.type = type
          document.head.appendChild(link)
        }
        link.href = href
      }
      
      // 设置 SVG favicon (现代浏览器支持)
      setFavicon('/favicon.svg', 'image/svg+xml')
      
      // 设置 ICO favicon (兼容性)
      let icoLink = document.querySelector('link[rel*="icon"][href$=".ico"]') as HTMLLinkElement
      if (!icoLink) {
        icoLink = document.createElement('link')
        icoLink.rel = 'shortcut icon'
        icoLink.type = 'image/x-icon'
        icoLink.href = '/favicon.ico'
        document.head.appendChild(icoLink)
      }
      
      // 设置 Apple Touch Icon (移动设备)
      let appleLink = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement
      if (!appleLink) {
        appleLink = document.createElement('link')
        appleLink.rel = 'apple-touch-icon'
        appleLink.href = '/favicon.svg'
        document.head.appendChild(appleLink)
      }
    }
  }, [])

  // 百度统计脚本加载
  useEffect(() => {
    // 确保在客户端环境中执行
    if (typeof window !== 'undefined') {
      // 检查是否已经加载过百度统计脚本
      if (window._hmt) {
        return
      }

      // 从环境变量读取 TALLY_URL
      const tallyUrl = process.env.NEXT_PUBLIC_TALLY_URL || ''
      
      // 初始化百度统计
      window._hmt = window._hmt || []
      
      // 动态创建和插入脚本
      const script = document.createElement('script')
      script.src = tallyUrl
      script.async = true
      
      // 获取第一个 script 标签
      const firstScript = document.getElementsByTagName('script')[0]
      if (firstScript && firstScript.parentNode) {
        firstScript.parentNode.insertBefore(script, firstScript)
      } else {
        // 如果没有找到 script 标签，则添加到 head 中
        document.head.appendChild(script)
      }
    }
  }, [])

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
      // 检查支付状态是否为 'enabled'
      setPaymentEnabled(response.data.status === 'enabled')
    } catch (error) {
      setPaymentEnabled(false)
    }
  }

  useEffect(() => {
    fetchUserStatus()
    fetchPaymentStatus()
  }, [])



  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdown])

  // 客户端清除cookie的辅助函数
  const clearClientCookie = () => {
    // 客户端清除cookie作为备用方案
    if (typeof document !== 'undefined') {
      document.cookie = 'jwt_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
      document.cookie = 'jwt_token=; Path=/; Max-Age=0'
    }
  }

  // 退出登录
  const handleLogout = async () => {
    try {
      const response = await axios.post('/api/logout')
      
      if (response.data.success) {
        // 更新本地状态
        setUserStatus({ isLoggedIn: false })
        setShowDropdown(false)
        
        // 客户端也清除cookie作为保险
        clearClientCookie()
        
        // 重新获取用户状态以确保状态同步
        await fetchUserStatus()
        
        // 跳转到首页
        router.push('/')
      } else {
        // 即使后端返回失败，也尝试刷新状态
        clearClientCookie()
        await fetchUserStatus()
      }
    } catch (error) {
      // 即使API调用失败，也尝试清除本地状态并刷新
      setUserStatus({ isLoggedIn: false })
      setShowDropdown(false)
      clearClientCookie()
      await fetchUserStatus()
      router.push('/')
    }
  }

  const handleLinkClick = (path: string, requireLogin: boolean = false) => {
    if (requireLogin && !userStatus.isLoggedIn) {
      router.push('/login')
    } else {
      router.push(path)
    }
  }

  return (
    <nav className="fixed top-0 w-full z-50 bg-black bg-opacity-40 backdrop-blur-md border-b border-purple-500/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            {/* Logo */}
            <div className="mr-3 animate-pulse">
              <svg className="w-8 h-8" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* 外圆环 */}
                <circle cx="20" cy="20" r="18" stroke="url(#logoGradient)" strokeWidth="2" fill="none" opacity="0.8"/>
                {/* 内部图表线条 */}
                <path d="M8 28 L14 22 L18 25 L24 16 L28 18 L32 12" stroke="url(#logoGradient)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                {/* 数据点 */}
                <circle cx="14" cy="22" r="2" fill="url(#logoGradient)"/>
                <circle cx="18" cy="25" r="2" fill="url(#logoGradient)"/>
                <circle cx="24" cy="16" r="2" fill="url(#logoGradient)"/>
                <circle cx="28" cy="18" r="2" fill="url(#logoGradient)"/>
                {/* AI芯片图案 */}
                <rect x="16" y="6" width="8" height="8" rx="2" stroke="url(#logoGradient)" strokeWidth="1.5" fill="none"/>
                <path d="M18 8 L22 8 M18 10 L22 10 M18 12 L22 12" stroke="url(#logoGradient)" strokeWidth="1" strokeLinecap="round"/>
                {/* 渐变定义 */}
                <defs>
                  <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{stopColor:'#4ade80'}}/>
                    <stop offset="50%" style={{stopColor:'#a78bfa'}}/>
                    <stop offset="100%" style={{stopColor:'#38bdf8'}}/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <Link href="/" className="text-2xl font-bold hover:opacity-80 transition-all cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #4ade80, #a78bfa, #38bdf8)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              FINC AI智能财报分析
            </Link>
          </div>

          {/* 右侧导航区域 - 统一容器 */}
          <div className="hidden md:flex items-center space-x-4">
            {/* 主导航菜单 */}
            <div className="flex items-center space-x-4">
              {/* 共同菜单项 */}
              <Link href="/" className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                router.pathname === '/' ? 'text-white bg-purple-600' : 'text-gray-300 hover:text-white hover:bg-purple-500/30'
              }`}>
                首页
              </Link>

              <button
                onClick={() => handleLinkClick('/financial-ai-agent', false)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  router.pathname === '/financial-ai-agent' ? 'text-white bg-purple-600' : 'text-gray-300 hover:text-white hover:bg-purple-500/30'
                }`}
              >
                <span className="inline-flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  </svg>
                  财报智能体
                </span>
              </button>

              <button
                onClick={() => handleLinkClick('/tasks', false)}
                className="text-gray-300 hover:text-white hover:bg-purple-500/30 px-3 py-2 rounded-md text-sm font-medium transition-all"
              >
                财报分析
              </button>

              {/* 根据用户状态显示不同的菜单项 */}
              {!userStatus.isLoggedIn && (
                <>
                  {paymentEnabled && (
                    <button
                      onClick={() => handleLinkClick('/payment')}
                      className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-4 py-2 rounded-md text-sm font-bold shadow-lg transition-all transform hover:scale-105"
                    >
                      <span className="inline-flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                        </svg>
                        开通专业版
                      </span>
                    </button>
                  )}
                  <Link href="/login" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-all">
                    登录
                  </Link>
                </>
              )}

              {userStatus.isLoggedIn && userStatus.userType === 'free' && (
                <>
                  {paymentEnabled && (
                    <button
                      onClick={() => handleLinkClick('/payment')}
                      className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-4 py-2 rounded-md text-sm font-bold shadow-lg transition-all transform hover:scale-105"
                    >
                      <span className="inline-flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                        </svg>
                        开通专业版
                      </span>
                    </button>
                  )}
                </>
              )}

              {userStatus.isLoggedIn && userStatus.userType === 'admin' && (
                <Link href="/admin-control" className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  router.pathname === '/admin-control' ? 'text-white bg-purple-600' : 'text-gray-300 hover:text-white hover:bg-purple-500/30'
                }`}>
                  后台管理
                </Link>
              )}
            </div>

            {/* 用户信息 - 登录后显示 */}
            {userStatus.isLoggedIn && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center space-x-2 text-gray-300 hover:text-white transition-all pl-4 border-l border-purple-500/30"
                >
                  <img
                    src={userStatus.userType === 'admin' 
                      ? '/default-admin-avatar.svg' 
                      : userStatus.user?.avatar || '/default-user-avatar.svg'
                    }
                    alt="用户头像"
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="hidden md:block">
                    {userStatus.user?.username || userStatus.user?.nickname || '用户'}
                  </span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* 下拉菜单 */}
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-black bg-opacity-90 backdrop-blur-md rounded-md shadow-lg py-1 z-50 border border-purple-500/30">
                    <div className="px-4 py-2 text-sm text-gray-300 border-b border-purple-500/30">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium">
                            {userStatus.user?.username || userStatus.user?.nickname}
                          </div>
                          <div className="text-xs text-gray-400">
                            {userStatus.userType === 'admin' && '管理员'}
                            {userStatus.userType === 'free' && '免费版用户'}
                            {userStatus.userType === 'premium' && (
                              <>
                                专业版用户
                                {userStatus.user?.remainingDays && (
                                  <div>还剩 {userStatus.user.remainingDays} 天</div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                        
                        {/* 续费按钮 - 只显示给premium用户 */}
                        {paymentEnabled && userStatus.userType === 'premium' && (
                          <button
                            onClick={() => {
                              setShowDropdown(false)
                              handleLinkClick('/payment')
                            }}
                            className="ml-2 px-2 py-1 text-xs bg-gradient-to-r from-green-500 to-blue-500 text-white hover:from-green-600 hover:to-blue-600 rounded transition-all font-medium"
                          >
                            续费
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-purple-500/30 transition-all"
                    >
                      退出
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
} 