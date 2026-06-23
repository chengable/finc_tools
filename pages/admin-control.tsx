import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import TopHeader from '../components/TopHeader'

interface User {
  id: string
  userId8Digit: string
  username: string
  nickname?: string
  avatar?: string
  userType: string
  status: string
  canLogin: boolean
  paymentType?: string
  expireTime?: string
  lastLoginTime?: string
  createdAt: string
}

interface WechatConfig {
  id: number
  configType: string
  appId?: string
  appSecret?: string
  callbackUrl?: string
  merchantId?: string
  merchantKey?: string
  payCallbackUrl?: string
  certPath?: string
  keyPath?: string
  status: string
}

interface Pagination {
  total: number
  page: number
  limit: number
  totalPages: number
}

export default function AdminControl() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('users')
  const [users, setUsers] = useState<User[]>([])
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 10, totalPages: 0 })
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [userTypeFilter, setUserTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [wechatConfigs, setWechatConfigs] = useState<Record<string, WechatConfig>>({})
  const [renewalCheckLoading, setRenewalCheckLoading] = useState(false)
  const [cacheStatsLoading, setCacheStatsLoading] = useState(false)
  const [cleanupCacheLoading, setCleanupCacheLoading] = useState(false)
  const [cacheStats, setCacheStats] = useState<any>(null)
  const [showUserTypeModal, setShowUserTypeModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [newUserType, setNewUserType] = useState<'free' | 'premium' | 'admin'>('free')
  const [expireTime, setExpireTime] = useState('')

  // 检查管理员权限
  useEffect(() => {
    checkAdminAuth()
  }, [])

  const checkAdminAuth = async () => {
    try {
      const response = await fetch('/api/admin/users?page=1&limit=1')
      if (response.status === 401 || response.status === 403) {
        router.push('/login')
        return
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      router.push('/login')
    }
  }

  // 获取用户列表
  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        search: searchTerm,
        userType: userTypeFilter,
        status: statusFilter
      })

      const response = await fetch(`/api/admin/users?${params}`)
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
        setPagination(data.pagination)
      } else {
        console.error('Failed to fetch users')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  // 获取微信配置
  const fetchWechatConfigs = async () => {
    try {
      const response = await fetch('/api/admin/wechat-config')
      if (response.ok) {
        const data = await response.json()
        setWechatConfigs(data.configs)
      }
    } catch (error) {
      console.error('Error fetching wechat configs:', error)
    }
  }

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers()
    } else if (activeTab === 'wechat') {
      fetchWechatConfigs()
    }
  }, [activeTab, searchTerm, userTypeFilter, statusFilter])

  // 用户操作
  const handleUserAction = async (userId: string, action: 'disable' | 'enable' | 'delete') => {
    if (action === 'delete' && !confirm('确定要删除该用户吗？此操作不可恢复！')) {
      return
    }

    try {
      const response = await fetch('/api/admin/user-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, action })
      })

      if (response.ok) {
        const result = await response.json()
        alert(result.message || '操作成功')
        fetchUsers(pagination.page)
      } else {
        const error = await response.json()
        alert(error.message || '操作失败')
      }
    } catch (error) {
      console.error('User action error:', error)
      alert('操作失败')
    }
  }

  // 打开用户类型切换弹框
  const openUserTypeModal = (user: User) => {
    setSelectedUser(user)
    setNewUserType(user.userType as 'free' | 'premium' | 'admin')
    // 如果当前是专业版用户，设置当前的到期时间
    if (user.userType === 'premium' && user.expireTime) {
      const expireDate = new Date(user.expireTime)
      const localDate = new Date(expireDate.getTime() - expireDate.getTimezoneOffset() * 60000)
      setExpireTime(localDate.toISOString().split('T')[0])
    } else {
      // 默认设置为1个月后
      const oneMonthLater = new Date()
      oneMonthLater.setMonth(oneMonthLater.getMonth() + 1)
      setExpireTime(oneMonthLater.toISOString().split('T')[0])
    }
    setShowUserTypeModal(true)
  }

  // 关闭用户类型切换弹框
  const closeUserTypeModal = () => {
    setShowUserTypeModal(false)
    setSelectedUser(null)
    setNewUserType('free')
    setExpireTime('')
  }

  // 确认切换用户类型
  const confirmUserTypeChange = async () => {
    if (!selectedUser) return

    try {
      const requestBody: any = {
        userId: selectedUser.id,
        action: 'change_user_type',
        userType: newUserType
      }

      // 如果是专业版，添加到期时间
      if (newUserType === 'premium' && expireTime) {
        // 转换为UTC时间存储
        const expireDate = new Date(expireTime + 'T23:59:59.999Z')
        requestBody.expireTime = expireDate.toISOString()
      }

      const response = await fetch('/api/admin/user-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      if (response.ok) {
        const result = await response.json()
        alert(result.message || '操作成功')
        fetchUsers(pagination.page)
        closeUserTypeModal()
      } else {
        const error = await response.json()
        alert(error.message || '操作失败')
      }
    } catch (error) {
      console.error('User type change error:', error)
      alert('操作失败')
    }
  }

  // 保存微信配置
  const saveWechatConfig = async (configType: 'login' | 'payment', formData: any) => {
    try {
      const response = await fetch('/api/admin/wechat-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ configType, ...formData })
      })

      if (response.ok) {
        alert('配置保存成功')
        fetchWechatConfigs()
      } else {
        const error = await response.json()
        alert(error.message || '保存失败')
      }
    } catch (error) {
      console.error('Save config error:', error)
      alert('保存失败')
    }
  }

  return (
    <>
      <Head>
        <title>后台管理系统 - FINC AI智能财报分析</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* 顶部导航栏 - 使用TopHeader组件 */}
        <TopHeader />

        {/* 主内容 */}
        <div className="pt-16 relative overflow-hidden">
          {/* 背景装饰 */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-600 rounded-full mix-blend-multiply filter blur-xl opacity-20"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-green-600 rounded-full mix-blend-multiply filter blur-xl opacity-20"></div>
            <div className="absolute top-1/3 left-1/4 w-32 h-32 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-15"></div>
          </div>

          <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 py-12">
            {/* 页面标题 */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 via-purple-400 to-blue-400 bg-clip-text text-transparent mb-4">
                后台管理系统
              </h1>
              <p className="text-xl text-gray-300">系统配置与用户管理</p>
            </div>

            {/* 主要内容区域 */}
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
              {/* 左侧标签导航 */}
              <div className="xl:col-span-1">
                <div className="bg-gradient-to-br from-slate-800/80 via-purple-800/60 to-green-800/40 p-6 rounded-2xl border border-purple-500/30 shadow-2xl sticky top-24">
                  <h2 className="text-xl font-bold text-white mb-6">管理功能</h2>
                  <div className="space-y-3">
                    <button
                      onClick={() => setActiveTab('users')}
                      className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all flex items-center ${
                        activeTab === 'users'
                          ? 'bg-gradient-to-r from-purple-600 to-green-600 text-white shadow-lg'
                          : 'bg-gray-600 text-gray-300 hover:text-white hover:bg-gray-500'
                      }`}
                    >
                      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
                      </svg>
                      用户管理
                    </button>
                    <button
                      onClick={() => setActiveTab('wechat')}
                      className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all flex items-center ${
                        activeTab === 'wechat'
                          ? 'bg-gradient-to-r from-purple-600 to-green-600 text-white shadow-lg'
                          : 'bg-gray-600 text-gray-300 hover:text-white hover:bg-gray-500'
                      }`}
                    >
                      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      </svg>
                      微信配置
                    </button>
                  </div>
                </div>
              </div>

              {/* 右侧内容区域 - 扩大到4列 */}
              <div className="xl:col-span-4">
                {activeTab === 'users' && (
                  <UserManagement
                    users={users}
                    pagination={pagination}
                    loading={loading}
                    searchTerm={searchTerm}
                    userTypeFilter={userTypeFilter}
                    statusFilter={statusFilter}
                    onSearchChange={setSearchTerm}
                    onUserTypeChange={setUserTypeFilter}
                    onStatusChange={setStatusFilter}
                    onPageChange={fetchUsers}
                    onUserAction={handleUserAction}
                    onOpenUserTypeModal={openUserTypeModal}
                    onLimitChange={(limit) => {
                      setPagination(prev => ({ ...prev, limit, page: 1 }))
                      fetchUsers(1)
                    }}
                  />
                )}

                {activeTab === 'wechat' && (
                  <WechatConfig
                    configs={wechatConfigs}
                    onSaveConfig={saveWechatConfig}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 用户类型切换弹框 */}
      <UserTypeModal
        show={showUserTypeModal}
        user={selectedUser}
        newUserType={newUserType}
        expireTime={expireTime}
        onClose={closeUserTypeModal}
        onUserTypeChange={setNewUserType}
        onExpireTimeChange={setExpireTime}
        onConfirm={confirmUserTypeChange}
      />
    </>
  )
}

// 用户管理组件
interface UserManagementProps {
  users: User[]
  pagination: Pagination
  loading: boolean
  searchTerm: string
  userTypeFilter: string
  statusFilter: string
  onSearchChange: (term: string) => void
  onUserTypeChange: (type: string) => void
  onStatusChange: (status: string) => void
  onPageChange: (page: number) => void
  onUserAction: (userId: string, action: 'disable' | 'enable' | 'delete') => void
  onOpenUserTypeModal: (user: User) => void
  onLimitChange: (limit: number) => void
}

function UserManagement({
  users,
  pagination,
  loading,
  searchTerm,
  userTypeFilter,
  statusFilter,
  onSearchChange,
  onUserTypeChange,
  onStatusChange,
  onPageChange,
  onUserAction,
  onOpenUserTypeModal,
  onLimitChange
}: UserManagementProps) {
  const getRoleStyle = (userType: string) => {
    switch (userType) {
      case 'premium':
        return 'bg-gradient-to-r from-purple-600 to-purple-700 text-white'
      case 'free':
        return 'bg-gradient-to-r from-gray-600 to-gray-700 text-white'
      case 'admin':
        return 'bg-gradient-to-r from-red-600 to-red-700 text-white'
      default:
        return 'bg-gradient-to-r from-gray-600 to-gray-700 text-white'
    }
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-gradient-to-r from-green-600 to-green-700 text-white'
      case 'offline':
        return 'bg-gradient-to-r from-gray-600 to-gray-700 text-white'
      default:
        return 'bg-gradient-to-r from-gray-600 to-gray-700 text-white'
    }
  }

  return (
    <div className="bg-gradient-to-br from-slate-800/80 via-purple-800/60 to-green-800/40 p-6 rounded-2xl border border-purple-500/30 shadow-2xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">用户管理</h2>
        <div className="text-sm text-gray-400">
          总用户数：<span className="text-green-400 font-bold">{pagination.total}</span>
        </div>
      </div>

                {/* 搜索和筛选区域 */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="md:col-span-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="搜索用户名或微信名..."
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="bg-gradient-to-r from-slate-800/90 to-purple-800/70 border border-purple-500/50 w-full px-4 py-3 pl-10 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:border-green-500/80 focus:ring-2 focus:ring-green-500/30 transition-all hover:border-purple-400/70"
                />
                <svg className="w-5 h-5 absolute left-3 top-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
            </div>

            <select
              value={userTypeFilter}
              onChange={(e) => onUserTypeChange(e.target.value)}
              className="bg-gradient-to-r from-slate-800/90 to-purple-800/70 border border-purple-500/50 px-4 py-3 rounded-lg text-white focus:outline-none focus:border-green-500/80 focus:ring-2 focus:ring-green-500/30 transition-all"
            >
              <option value="" className="bg-slate-900 text-white">全部身份</option>
              <option value="premium" className="bg-slate-900 text-white">专业版</option>
              <option value="free" className="bg-slate-900 text-white">免费版</option>
              <option value="admin" className="bg-slate-900 text-white">管理员</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => onStatusChange(e.target.value)}
              className="bg-gradient-to-r from-slate-800/90 to-purple-800/70 border border-purple-500/50 px-4 py-3 rounded-lg text-white focus:outline-none focus:border-green-500/80 focus:ring-2 focus:ring-green-500/30 transition-all"
            >
              <option value="" className="bg-slate-900 text-white">全部状态</option>
              <option value="online" className="bg-slate-900 text-white">在线</option>
              <option value="offline" className="bg-slate-900 text-white">离线</option>
            </select>

            <select
              value={pagination.limit.toString()}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="bg-gradient-to-r from-slate-800/90 to-purple-800/70 border border-purple-500/50 px-4 py-3 rounded-lg text-white focus:outline-none focus:border-green-500/80 focus:ring-2 focus:ring-green-500/30 transition-all"
            >
              <option value="10" className="bg-slate-900 text-white">每页10条</option>
              <option value="20" className="bg-slate-900 text-white">每页20条</option>
              <option value="30" className="bg-slate-900 text-white">每页30条</option>
              <option value="50" className="bg-slate-900 text-white">每页50条</option>
            </select>
          </div>

      {/* 用户表格 */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm min-w-max">
          <thead>
            <tr className="bg-gradient-to-r from-purple-600/30 to-green-600/20">
              <th className="text-left text-white font-medium p-4 border border-purple-500/30 min-w-[100px]">用户ID</th>
              <th className="text-left text-white font-medium p-4 border border-purple-500/30 min-w-[80px]">头像</th>
              <th className="text-left text-white font-medium p-4 border border-purple-500/30 min-w-[120px]">用户名</th>
              <th className="text-left text-white font-medium p-4 border border-purple-500/30 min-w-[150px]">微信名</th>
              <th className="text-center text-white font-medium p-4 border border-purple-500/30 min-w-[80px]">身份</th>
              <th className="text-center text-white font-medium p-4 border border-purple-500/30 min-w-[80px]">状态</th>
              <th className="text-center text-white font-medium p-4 border border-purple-500/30 min-w-[80px]">可登录</th>
              <th className="text-left text-white font-medium p-4 border border-purple-500/30 min-w-[120px]">付费方式</th>
              <th className="text-left text-white font-medium p-4 border border-purple-500/30 min-w-[120px]">到期时间</th>
              <th className="text-left text-white font-medium p-4 border border-purple-500/30 min-w-[120px]">最近登录</th>
              <th className="text-center text-white font-medium p-4 border border-purple-500/30 min-w-[120px]">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={11} className="text-center py-8 text-gray-400">
                  加载中...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center py-8 text-gray-400">
                  暂无数据
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-purple-600/10 transition-colors">
                  <td className="text-white p-4 border border-purple-500/30 font-mono text-sm">{user.userId8Digit}</td>
                  <td className="p-4 border border-purple-500/30">
                    <img
                      src={user.avatar || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face&auto=format`}
                      alt="用户头像"
                      className="w-10 h-10 rounded-full"
                    />
                  </td>
                  <td className="text-white p-4 border border-purple-500/30">{user.username}</td>
                  <td className="text-gray-300 p-4 border border-purple-500/30">{user.nickname || '-'}</td>
                  <td className="text-center p-4 border border-purple-500/30">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleStyle(user.userType)}`}>
                      {user.userType === 'premium' ? '专业版' : user.userType === 'admin' ? '管理员' : '免费版'}
                    </span>
                  </td>
                  <td className="text-center p-4 border border-purple-500/30">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(user.status)}`}>
                      {user.status === 'online' ? '在线' : '离线'}
                    </span>
                  </td>
                  <td className="text-center p-4 border border-purple-500/30">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      user.canLogin 
                        ? 'bg-green-600 text-white' 
                        : 'bg-red-600 text-white'
                    }`}>
                      {user.canLogin ? '是' : '否'}
                    </span>
                  </td>
                  <td className="text-gray-300 p-4 border border-purple-500/30">
                    {user.paymentType === 'one_time' ? '一次性付费' : 
                     user.paymentType === 'monthly' ? '连续包月' : '-'}
                  </td>
                  <td className="text-gray-300 p-4 border border-purple-500/30">
                    {user.expireTime ? new Date(user.expireTime).toLocaleDateString('zh-CN') : '-'}
                  </td>
                  <td className="text-gray-300 p-4 border border-purple-500/30">
                    {user.lastLoginTime ? new Date(user.lastLoginTime).toLocaleDateString('zh-CN') : '-'}
                  </td>
                  <td className="text-center p-4 border border-purple-500/30">
                    <div className="flex justify-center space-x-2">
                      <button
                        onClick={() => onOpenUserTypeModal(user)}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-xs font-medium transition-all hover:opacity-80"
                      >
                        切换身份
                      </button>
                      <button
                        onClick={() => onUserAction(user.id, user.canLogin ? 'disable' : 'enable')}
                        className={`px-3 py-1 rounded text-xs font-medium transition-all hover:opacity-80 ${
                          user.canLogin
                            ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                      >
                        {user.canLogin ? '禁用' : '启用'}
                      </button>
                      <button
                        onClick={() => onUserAction(user.id, 'delete')}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-medium transition-all hover:opacity-80"
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-gray-400">
            显示 {(pagination.page - 1) * pagination.limit + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} 条，共 {pagination.total} 条记录
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="bg-gray-600 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-all"
            >
              上一页
            </button>
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              const page = i + Math.max(1, pagination.page - 2)
              return page <= pagination.totalPages ? (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    page === pagination.page
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-600 hover:bg-gray-700 text-white'
                  }`}
                >
                  {page}
                </button>
              ) : null
            })}
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="bg-gray-600 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-all"
            >
              下一页
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// 用户类型切换弹框组件
interface UserTypeModalProps {
  show: boolean
  user: User | null
  newUserType: 'free' | 'premium' | 'admin'
  expireTime: string
  onClose: () => void
  onUserTypeChange: (type: 'free' | 'premium' | 'admin') => void
  onExpireTimeChange: (time: string) => void
  onConfirm: () => void
}

function UserTypeModal({
  show,
  user,
  newUserType,
  expireTime,
  onClose,
  onUserTypeChange,
  onExpireTimeChange,
  onConfirm
}: UserTypeModalProps) {
  if (!show || !user) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-slate-800 to-purple-900 p-6 rounded-2xl border border-purple-500/30 max-w-md w-full mx-4 shadow-2xl">
        <h3 className="text-xl font-bold text-white mb-4">切换用户身份</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              当前用户：{user.username} ({user.userId8Digit})
            </label>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              当前身份：{user.userType === 'premium' ? '专业版' : user.userType === 'admin' ? '管理员' : '免费版'}
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">新身份</label>
            <select
              value={newUserType}
              onChange={(e) => onUserTypeChange(e.target.value as 'free' | 'premium' | 'admin')}
              className="w-full bg-slate-700 border border-purple-500/50 px-3 py-2 rounded-lg text-white focus:outline-none focus:border-green-500/80 focus:ring-2 focus:ring-green-500/30"
            >
              <option value="free">免费版</option>
              <option value="premium">专业版</option>
              <option value="admin">管理员</option>
            </select>
          </div>

          {newUserType === 'premium' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">到期时间</label>
              <input
                type="date"
                value={expireTime}
                onChange={(e) => onExpireTimeChange(e.target.value)}
                className="w-full bg-slate-700 border border-purple-500/50 px-3 py-2 rounded-lg text-white focus:outline-none focus:border-green-500/80 focus:ring-2 focus:ring-green-500/30"
              />
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-all"
            >
              取消
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-all"
            >
              确认切换
            </button>
          </div>
        </div>
      </div>


    </div>
  )
}

// 微信配置组件
interface WechatConfigProps {
  configs: Record<string, WechatConfig>
  onSaveConfig: (configType: 'login' | 'payment', formData: any) => void
}

function WechatConfig({ configs, onSaveConfig }: WechatConfigProps) {
  const [loginConfig, setLoginConfig] = useState({
    appId: '',
    appSecret: '',
    callbackUrl: '',
    status: 'disabled'
  })

  const [paymentConfig, setPaymentConfig] = useState({
    appId: '',
    merchantId: '',
    merchantKey: '',
    payCallbackUrl: '',
    certPath: '',
    keyPath: '',
    status: 'disabled'
  })

  const [renewalCheckLoading, setRenewalCheckLoading] = useState(false)
  const [cacheStatsLoading, setCacheStatsLoading] = useState(false)
  const [cleanupCacheLoading, setCleanupCacheLoading] = useState(false)
  const [cacheStats, setCacheStats] = useState<any>(null)
  const [showQRModal, setShowQRModal] = useState(false)
  const [qrData, setQrData] = useState<any>(null)
  const [callbackTestLoading, setCallbackTestLoading] = useState(false)
  const [testOrderNo, setTestOrderNo] = useState('')
  const [showCallbackModal, setShowCallbackModal] = useState(false)
  
  // 测试支付轮询相关状态
  const [testPaymentStatus, setTestPaymentStatus] = useState<'pending' | 'paid' | 'failed' | 'expired'>('pending')
  const [testStatusMessage, setTestStatusMessage] = useState('等待支付中...')
  const [testStatusPolling, setTestStatusPolling] = useState<NodeJS.Timeout | null>(null)
  const [cleanupOrdersLoading, setCleanupOrdersLoading] = useState(false)
  
  useEffect(() => {
    if (configs.login) {
      setLoginConfig({
        appId: configs.login.appId || '',
        appSecret: configs.login.appSecret || '',
        callbackUrl: configs.login.callbackUrl || '',
        status: configs.login.status || 'disabled'
      })
    }

    if (configs.payment) {
      setPaymentConfig({
        appId: configs.payment.appId || '',
        merchantId: configs.payment.merchantId || '',
        merchantKey: configs.payment.merchantKey || '',
        payCallbackUrl: configs.payment.payCallbackUrl || '',
        certPath: configs.payment.certPath || '',
        keyPath: configs.payment.keyPath || '',
        status: configs.payment.status || 'disabled'
      })
    }
  }, [configs])



  // 检查测试订单支付状态
  const checkTestPaymentStatus = async (orderNo: string) => {
    try {
      const response = await fetch(`/api/payment/query-status?orderNo=${orderNo}`, {
        credentials: 'include'
      })
      
      if (!response.ok) {
        console.warn(`查询测试订单状态失败，状态码: ${response.status}`)
        return
      }
      
      const result = await response.json()
      
      if (result.success) {
        const status = result.data
        setTestPaymentStatus(status.status)
        
        console.log('🔍 管理员测试订单状态轮询:', {
          orderNo,
          status: status.status,
          timestamp: new Date().toISOString()
        })
        
        switch (status.status) {
          case 'pending':
            setTestStatusMessage('⏳ 等待支付中...')
            break
          case 'paid':
            setTestStatusMessage('✅ 支付成功！测试完成')
            console.log('🎉 管理员测试支付成功检测！')
            
            // 停止轮询
            if (testStatusPolling) {
              clearInterval(testStatusPolling)
              setTestStatusPolling(null)
            }
            
            // 显示成功消息
            setTimeout(() => {
              setTestStatusMessage('✅ 测试支付流程验证成功')
            }, 1000)
            break
          case 'failed':
            setTestStatusMessage('❌ 支付失败')
            if (testStatusPolling) {
              clearInterval(testStatusPolling)
              setTestStatusPolling(null)
            }
            break
          case 'expired':
            setTestStatusMessage('⏰ 订单已过期')
            if (testStatusPolling) {
              clearInterval(testStatusPolling)
              setTestStatusPolling(null)
            }
            break
        }
      } else {
        console.warn('查询测试订单状态返回失败:', result.message)
      }
    } catch (error) {
      console.error('查询测试订单状态异常:', error)
    }
  }

  // 启动测试订单轮询
  const startTestPaymentPolling = (orderNo: string) => {
    console.log('🚀 启动管理员测试订单轮询:', orderNo)
    
    // 清除之前的轮询
    if (testStatusPolling) {
      clearInterval(testStatusPolling)
    }
    
    // 重置状态
    setTestPaymentStatus('pending')
    setTestStatusMessage('⏳ 等待支付中...')
    
    let pollCount = 0
    const maxPollCount = 200 // 最多轮询200次
    
    const interval = setInterval(() => {
      pollCount++
      
      checkTestPaymentStatus(orderNo)
      
      // 达到最大轮询次数后停止
      if (pollCount >= maxPollCount) {
        console.log('测试订单轮询已达到最大次数，停止轮询')
        clearInterval(interval)
        setTestStatusPolling(null)
        setTestStatusMessage('⚠️ 轮询超时，请手动检查支付状态')
      }
    }, 3000) // 每3秒查询一次
    
    setTestStatusPolling(interval)
  }

  // 测试微信支付二维码
  const handleTestPaymentQR = async () => {
    try {
      const response = await fetch('/api/admin/wechat/test-payment-qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const result = await response.json()
      
      if (result.success) {
        setQrData(result.data)
        setShowQRModal(true)
        console.log('支付二维码数据：', result.data)
        
        // 启动轮询监控支付状态
        if (result.data.outTradeNo) {
          startTestPaymentPolling(result.data.outTradeNo)
        }
      } else {
        alert(`生成失败：${result.message}`)
      }
    } catch (error) {
      console.error('生成支付二维码失败:', error)
      alert('生成支付二维码失败，请检查网络连接')
    }
  }

  // 测试支付回调
  const handleTestPaymentCallback = async () => {
    if (!testOrderNo) {
      alert('请输入订单号')
      return
    }

    setCallbackTestLoading(true)
    
    try {
      const response = await fetch('/api/admin/wechat/test-payment-callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderNo: testOrderNo
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        alert('✅ 支付回调测试成功！用户权限已更新')
        setShowCallbackModal(false)
        setTestOrderNo('')
      } else {
        alert(`❌ 回调测试失败：${result.message}`)
      }
    } catch (error) {
      console.error('测试支付回调失败:', error)
      alert('测试支付回调失败，请检查网络连接')
    } finally {
      setCallbackTestLoading(false)
    }
  }

  // 清理过期订单
  const handleCleanupExpiredOrders = async () => {
    if (!confirm('确定要清理过期的未支付订单吗？这将删除24小时前创建且仍未支付的订单。')) {
      return
    }

    try {
      setCleanupOrdersLoading(true)
      const response = await fetch('/api/admin/cleanup-expired-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const result = await response.json()
      
      if (result.success) {
        const { totalFound, totalCleaned, cleanedOrders } = result.data
        
        let message = `✅ 清理完成！\n`
        message += `找到 ${totalFound} 个过期订单\n`
        message += `成功清理 ${totalCleaned} 个订单`
        
        if (cleanedOrders.length > 0 && cleanedOrders.length <= 5) {
          message += '\n\n清理的订单：'
          cleanedOrders.forEach((order: any) => {
            message += `\n- ${order.orderNo} (${order.amount}分, ${new Date(order.createdAt).toLocaleString()})`
          })
        } else if (cleanedOrders.length > 5) {
          message += `\n\n显示前5个清理的订单：`
          cleanedOrders.slice(0, 5).forEach((order: any) => {
            message += `\n- ${order.orderNo} (${order.amount}分)`
          })
          message += `\n... 还有 ${cleanedOrders.length - 5} 个订单`
        }
        
        alert(message)
      } else {
        alert(`❌ 清理失败：${result.message}`)
      }
    } catch (error) {
      console.error('清理过期订单失败:', error)
      alert('清理过期订单失败，请检查网络连接')
    } finally {
      setCleanupOrdersLoading(false)
    }
  }

  // 手动续费检查
  const handleManualRenewalCheck = async () => {
    if (!confirm('确定要执行手动续费检查吗？这将检查所有即将过期的连续包月用户并处理过期用户。')) {
      return
    }

    try {
      setRenewalCheckLoading(true)
      const response = await fetch('/api/admin/manual-renewal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const result = await response.json()
      
      if (result.success) {
        alert('手动续费检查执行完成！请查看控制台日志了解详细情况。')
        console.log('手动续费检查结果：', result)
      } else {
        alert(`续费检查失败：${result.message}`)
      }
    } catch (error) {
      console.error('手动续费检查失败:', error)
      alert('手动续费检查失败，请检查网络连接')
    } finally {
      setRenewalCheckLoading(false)
    }
  }

  // 查看AI分析缓存统计
  const handleGetCacheStats = async () => {
    try {
      setCacheStatsLoading(true)
      const response = await fetch('/api/admin/ai-analysis-cache', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const result = await response.json()
      
      if (result.success) {
        setCacheStats(result.data)
        const stats = result.data
        alert(`AI分析缓存统计信息：
总缓存: ${stats.total} 条
有效缓存: ${stats.valid} 条
过期缓存: ${stats.expired} 条
待处理: ${stats.pending} 条
失败记录: ${stats.failed} 条`)
        console.log('AI分析缓存统计：', result.data)
      } else {
        alert(`获取统计失败：${result.message}`)
      }
    } catch (error) {
      console.error('获取AI缓存统计失败:', error)
      alert('获取AI缓存统计失败，请检查网络连接')
    } finally {
      setCacheStatsLoading(false)
    }
  }

  // 清理过期的AI分析缓存
  const handleCleanupCache = async () => {
    if (!confirm('确定要清理过期的AI分析缓存吗？这将删除所有过期的缓存记录。')) {
      return
    }

    try {
      setCleanupCacheLoading(true)
      const response = await fetch('/api/admin/ai-analysis-cache', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const result = await response.json()
      
      if (result.success) {
        alert(`缓存清理完成！删除了 ${result.data.deletedCount} 条过期缓存记录`)
        console.log('缓存清理结果：', result)
        // 清理完后重新获取统计信息
        setTimeout(handleGetCacheStats, 1000)
      } else {
        alert(`缓存清理失败：${result.message}`)
      }
    } catch (error) {
      console.error('清理AI缓存失败:', error)
      alert('清理AI缓存失败，请检查网络连接')
    } finally {
      setCleanupCacheLoading(false)
    }
  }

  // 检查微信支付配置
  const handleCheckPaymentConfig = async () => {
    try {
      const response = await fetch('/api/payment/config-status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const result = await response.json()
      
      if (result.success) {
        if (result.status === 'enabled') {
          alert('✅ 微信支付配置检查通过！所有配置项都正确。')
        } else if (result.status === 'invalid') {
          alert(`❌ 微信支付配置存在问题：\n${result.errors.join('\n')}`)
        } else {
          alert('⚠️ 微信支付未启用或配置缺失')
        }
        console.log('微信支付配置检查结果：', result)
      } else {
        alert(`检查失败：${result.message}`)
      }
    } catch (error) {
      console.error('检查微信支付配置失败:', error)
      alert('检查配置失败，请检查网络连接')
    }
  }

  return (
    <div className="space-y-6">
      {/* 微信登录配置 */}
      <div className="bg-gradient-to-br from-slate-800/80 via-purple-800/60 to-green-800/40 p-6 rounded-2xl border border-purple-500/30 shadow-2xl">
        <div className="flex items-center mb-6">
          <svg className="w-6 h-6 mr-3 text-green-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8.5 4C5.5 4 3 6 3 8.5c0 1.5.8 2.8 2 3.5L4.5 14l2.5-1.5c.5.1 1 .1 1.5.1C10.5 12.6 12 10.6 12 8.5 12 6 9.5 4 8.5 4zM7 7.5c-.3 0-.5-.2-.5-.5s.2-.5.5-.5.5.2.5.5-.2.5-.5.5zm3 0c-.3 0-.5-.2-.5-.5s.2-.5.5-.5.5.2.5.5-.2.5-.5.5zM15.5 10c-3 0-5.5 2-5.5 4.5 0 1.5.8 2.8 2 3.5L11.5 20l2.5-1.5c.5.1 1 .1 1.5.1 3 0 5.5-2 5.5-4.5S18.5 10 15.5 10zM14 16c-.3 0-.5-.2-.5-.5s.2-.5.5-.5.5.2.5.5-.2.5-.5.5zm3 0c-.3 0-.5-.2-.5-.5s.2-.5.5-.5.5.2.5.5-.2.5-.5.5z"/>
          </svg>
          <h2 className="text-2xl font-bold text-white">微信扫码登录配置</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">App ID</label>
            <input
              type="text"
              value={loginConfig.appId}
              onChange={(e) => setLoginConfig({...loginConfig, appId: e.target.value})}
              className="bg-gradient-to-r from-slate-800/90 to-purple-800/70 border border-purple-500/50 w-full px-4 py-3 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:border-green-500/80 focus:ring-2 focus:ring-green-500/30 transition-all"
              placeholder="请输入微信App ID"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">App Secret</label>
            <input
              type="password"
              value={loginConfig.appSecret}
              onChange={(e) => setLoginConfig({...loginConfig, appSecret: e.target.value})}
              className="bg-gradient-to-r from-slate-800/90 to-purple-800/70 border border-purple-500/50 w-full px-4 py-3 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:border-green-500/80 focus:ring-2 focus:ring-green-500/30 transition-all"
              placeholder="请输入微信App Secret"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">回调URL</label>
            <input
              type="text"
              value={loginConfig.callbackUrl}
              onChange={(e) => setLoginConfig({...loginConfig, callbackUrl: e.target.value})}
              className="bg-gradient-to-r from-slate-800/90 to-purple-800/70 border border-purple-500/50 w-full px-4 py-3 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:border-green-500/80 focus:ring-2 focus:ring-green-500/30 transition-all"
              placeholder="https://your-domain.com/api/wechat/callback"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">状态</label>
            <select
              value={loginConfig.status}
              onChange={(e) => setLoginConfig({...loginConfig, status: e.target.value})}
              className="bg-gradient-to-r from-slate-800/90 to-purple-800/70 border border-purple-500/50 w-full px-4 py-3 rounded-lg text-white focus:outline-none focus:border-green-500/80 focus:ring-2 focus:ring-green-500/30 transition-all"
            >
              <option value="enabled" className="bg-slate-900 text-white">启用</option>
              <option value="disabled" className="bg-slate-900 text-white">禁用</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={() => onSaveConfig('login', loginConfig)}
            className="bg-gradient-to-r from-purple-600 to-green-600 hover:from-purple-700 hover:to-green-700 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105"
          >
            保存配置
          </button>
        </div>
      </div>

      {/* 微信支付配置 */}
      <div className="bg-gradient-to-br from-slate-800/80 via-purple-800/60 to-green-800/40 p-6 rounded-2xl border border-purple-500/30 shadow-2xl">
        <div className="flex items-center mb-6">
          <svg className="w-6 h-6 mr-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
          </svg>
          <h2 className="text-2xl font-bold text-white">微信扫码支付配置</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">微信支付APP ID</label>
            <input
              type="text"
              value={paymentConfig.appId}
              onChange={(e) => setPaymentConfig({...paymentConfig, appId: e.target.value})}
              className="bg-gradient-to-r from-slate-800/90 to-purple-800/70 border border-purple-500/50 w-full px-4 py-3 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:border-green-500/80 focus:ring-2 focus:ring-green-500/30 transition-all"
              placeholder="wx1234567890abcdef"
            />
            <p className="text-xs text-gray-400 mt-1">⚠️ 注意：微信支付和微信登录可以使用不同的APP ID</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">商户号</label>
            <input
              type="text"
              value={paymentConfig.merchantId}
              onChange={(e) => setPaymentConfig({...paymentConfig, merchantId: e.target.value})}
              className="bg-gradient-to-r from-slate-800/90 to-purple-800/70 border border-purple-500/50 w-full px-4 py-3 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:border-green-500/80 focus:ring-2 focus:ring-green-500/30 transition-all"
              placeholder="请输入商户号"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">商户密钥</label>
            <input
              type="password"
              value={paymentConfig.merchantKey}
              onChange={(e) => setPaymentConfig({...paymentConfig, merchantKey: e.target.value})}
              className="bg-gradient-to-r from-slate-800/90 to-purple-800/70 border border-purple-500/50 w-full px-4 py-3 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:border-green-500/80 focus:ring-2 focus:ring-green-500/30 transition-all"
              placeholder="请输入商户密钥"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">支付回调URL</label>
            <input
              type="text"
              value={paymentConfig.payCallbackUrl}
              onChange={(e) => setPaymentConfig({...paymentConfig, payCallbackUrl: e.target.value})}
              className="bg-gradient-to-r from-slate-800/90 to-purple-800/70 border border-purple-500/50 w-full px-4 py-3 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:border-green-500/80 focus:ring-2 focus:ring-green-500/30 transition-all"
              placeholder="https://your-domain.com/api/wechat/pay/callback"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">证书路径</label>
            <input
              type="text"
              value={paymentConfig.certPath}
              onChange={(e) => setPaymentConfig({...paymentConfig, certPath: e.target.value})}
              className="bg-gradient-to-r from-slate-800/90 to-purple-800/70 border border-purple-500/50 w-full px-4 py-3 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:border-green-500/80 focus:ring-2 focus:ring-green-500/30 transition-all"
              placeholder="/etc/ssl/wechat/apiclient_cert.pem"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">私钥路径</label>
            <input
              type="text"
              value={paymentConfig.keyPath}
              onChange={(e) => setPaymentConfig({...paymentConfig, keyPath: e.target.value})}
              className="bg-gradient-to-r from-slate-800/90 to-purple-800/70 border border-purple-500/50 w-full px-4 py-3 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:border-green-500/80 focus:ring-2 focus:ring-green-500/30 transition-all"
              placeholder="/etc/ssl/wechat/apiclient_key.pem"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">支付状态</label>
            <select
              value={paymentConfig.status}
              onChange={(e) => setPaymentConfig({...paymentConfig, status: e.target.value})}
              className="bg-gradient-to-r from-slate-800/90 to-purple-800/70 border border-purple-500/50 w-full px-4 py-3 rounded-lg text-white focus:outline-none focus:border-green-500/80 focus:ring-2 focus:ring-green-500/30 transition-all"
            >
              <option value="enabled" className="bg-slate-900 text-white">启用</option>
              <option value="disabled" className="bg-slate-900 text-white">禁用</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end space-x-4 mt-6">
          <button
            onClick={handleCheckPaymentConfig}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105"
          >
            检查配置
          </button>
          <button
            onClick={() => onSaveConfig('payment', paymentConfig)}
            className="bg-gradient-to-r from-purple-600 to-green-600 hover:from-purple-700 hover:to-green-700 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105"
          >
            保存配置
          </button>
        </div>
      </div>

      {/* 功能测试 */}
      <div className="bg-gradient-to-br from-slate-800/80 via-purple-800/60 to-green-800/40 p-6 rounded-2xl border border-purple-500/30 shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-6">功能测试</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
          <div className="text-center">
            <h3 className="text-lg font-medium text-white mb-4">测试微信支付</h3>
            <div className="space-y-3">
            <button 
              onClick={handleTestPaymentQR}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-all w-full transform hover:scale-105"
            >
              生成测试支付二维码
            </button>
              <button 
                onClick={() => setShowCallbackModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-all w-full transform hover:scale-105"
              >
                测试支付回调
              </button>
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-medium text-white mb-4">续费检查</h3>
            <button 
              onClick={handleManualRenewalCheck}
              disabled={renewalCheckLoading}
              className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all w-full transform hover:scale-105 disabled:transform-none"
            >
              {renewalCheckLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  执行中...
                </span>
              ) : (
                '手动续费检查'
              )}
            </button>
            <p className="text-xs text-gray-400 mt-2">
              检查即将过期的连续包月用户并处理过期用户
            </p>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-medium text-white mb-4">缓存统计</h3>
            <button 
              onClick={handleGetCacheStats}
              disabled={cacheStatsLoading}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all w-full transform hover:scale-105 disabled:transform-none"
            >
              {cacheStatsLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  查询中...
                </span>
              ) : (
                'AI缓存统计'
              )}
            </button>
            <p className="text-xs text-gray-400 mt-2">
              查看AI分析缓存的统计信息
            </p>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-medium text-white mb-4">清理缓存</h3>
            <button 
              onClick={handleCleanupCache}
              disabled={cleanupCacheLoading}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all w-full transform hover:scale-105 disabled:transform-none"
            >
              {cleanupCacheLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  清理中...
                </span>
              ) : (
                '清理过期缓存'
              )}
            </button>
            <p className="text-xs text-gray-400 mt-2">
              删除所有过期的AI分析缓存记录
            </p>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-medium text-white mb-4">清理订单</h3>
            <button 
              onClick={handleCleanupExpiredOrders}
              disabled={cleanupOrdersLoading}
              className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all w-full transform hover:scale-105 disabled:transform-none"
            >
              {cleanupOrdersLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  清理中...
                </span>
              ) : (
                '清理过期订单'
              )}
            </button>
            <p className="text-xs text-gray-400 mt-2">
              删除24小时前创建的未支付订单
            </p>
          </div>
        </div>
      </div>

      {/* 测试支付二维码模态框 */}
      {showQRModal && qrData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-slate-800 to-purple-900 p-8 rounded-2xl border border-purple-500/30 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">测试支付二维码</h3>
              <button
                onClick={() => setShowQRModal(false)}
                className="text-gray-400 hover:text-white text-2xl leading-none"
              >
                ×
              </button>
            </div>
            
            <div className="text-center">
              {/* 二维码区域 */}
              <div className="bg-white rounded-xl p-4 inline-block mb-6">
                <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                  {qrData.qrCodeImage ? (
                  <img
                      src={qrData.qrCodeImage}
                    alt="测试支付二维码"
                    className="w-full h-full rounded-lg"
                  />
                  ) : (
                    <div className="text-gray-500 text-center">
                      <div className="text-sm">二维码生成中...</div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* 订单信息 */}
              <div className="space-y-3 text-left">
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">订单号:</span>
                    <span className="text-green-400 font-mono text-sm">{qrData.outTradeNo}</span>
                  </div>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">金额:</span>
                    <span className="text-green-400 font-bold">{qrData.totalFee}分</span>
                  </div>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">商品:</span>
                    <span className="text-blue-400">{qrData.body}</span>
                  </div>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">过期时间:</span>
                    <span className="text-yellow-400 text-sm">
                      {new Date(qrData.expireTime).toLocaleString()}
                    </span>
                  </div>
                </div>
                
                {/* 支付状态显示 */}
                <div className="bg-slate-700/50 rounded-lg p-3 border-l-4 border-blue-500">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {testPaymentStatus === 'pending' && (
                        <svg className="animate-spin h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      )}
                      {testPaymentStatus === 'paid' && (
                        <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                      {testPaymentStatus === 'failed' && (
                        <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      )}
                      {testPaymentStatus === 'expired' && (
                        <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-gray-300">支付状态:</div>
                      <div className={`text-sm font-medium ${
                        testPaymentStatus === 'pending' ? 'text-blue-400' :
                        testPaymentStatus === 'paid' ? 'text-green-400' :
                        testPaymentStatus === 'failed' ? 'text-red-400' :
                        'text-yellow-400'
                      }`}>
                        {testStatusMessage}
                      </div>
                    </div>
                    {testStatusPolling && (
                      <div className="text-xs text-gray-400">
                        实时监控中
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-6 space-y-3">
                {testPaymentStatus === 'paid' && (
                  <div className="bg-green-600/20 border border-green-500/30 rounded-lg p-3 text-center">
                    <div className="text-green-400 text-sm font-medium">🎉 测试支付成功！</div>
                    <div className="text-green-300 text-xs mt-1">支付流程验证完成，系统运行正常</div>
                  </div>
                )}
                
                <button
                  onClick={() => {
                    // 停止轮询
                    if (testStatusPolling) {
                      clearInterval(testStatusPolling)
                      setTestStatusPolling(null)
                    }
                    setShowQRModal(false)
                    // 重置状态
                    setTestPaymentStatus('pending')
                    setTestStatusMessage('等待支付中...')
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-all w-full"
                >
                  {testStatusPolling ? '停止监控并关闭' : '关闭'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 测试支付回调模态框 */}
      {showCallbackModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-slate-800 to-purple-900 p-8 rounded-2xl border border-purple-500/30 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">测试支付回调</h3>
              <button
                onClick={() => setShowCallbackModal(false)}
                className="text-gray-400 hover:text-white text-2xl leading-none"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">订单号</label>
                <input
                  type="text"
                  value={testOrderNo}
                  onChange={(e) => setTestOrderNo(e.target.value)}
                  placeholder="请输入要测试的订单号"
                  className="bg-gradient-to-r from-slate-800/90 to-purple-800/70 border border-purple-500/50 w-full px-4 py-3 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:border-green-500/80 focus:ring-2 focus:ring-green-500/30 transition-all"
                />
                <p className="text-xs text-gray-400 mt-1">输入一个待支付的订单号，系统将模拟支付成功回调</p>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleTestPaymentCallback}
                  disabled={callbackTestLoading || !testOrderNo}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-all flex-1 transform hover:scale-105 disabled:transform-none"
                >
                  {callbackTestLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      测试中...
                    </span>
                  ) : (
                    '执行测试'
                  )}
                </button>
                <button
                  onClick={() => setShowCallbackModal(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-all"
                >
                  取消
                </button>
              </div>
              
              <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-3">
                <h4 className="text-sm font-bold text-blue-300 mb-2">使用说明：</h4>
                <ul className="text-xs text-gray-300 space-y-1">
                  <li>• 输入一个已生成但未支付的订单号</li>
                  <li>• 系统将模拟微信支付成功回调</li>
                  <li>• 订单状态会更新为已支付</li>
                  <li>• 用户权限会自动升级</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}