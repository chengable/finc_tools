import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import TopHeader from '../components/TopHeader';

interface Company {
  code: string;
  name: string;
  label?: string;
  type?: number;
}

interface Task {
  taskId: string;
  taskName: string;
  taskType: 'enterprise' | 'industry';
  companies: Company[];
  status: 'analyzing' | 'completed' | 'error';
  errorReason?: string;
  startTime: string;
  endTime?: string;
  analysisNodes: {
    collect_data: 'pending' | 'in_progress' | 'completed' | 'error';
    calculate_data: 'pending' | 'in_progress' | 'completed' | 'error';
  };
  user?: {
    username: string;
    nickname?: string;
  };
}

interface User {
  id: string;
  username: string;
  nickname?: string;
  userType: 'free' | 'professional' | 'admin';
}

interface TaskListResponse {
  success: boolean;
  data: {
    tasks: Task[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface TaskStatsResponse {
  success: boolean;
  data: {
    totalTasks: number;
  };
}

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [totalTasks, setTotalTasks] = useState(0);
  const [totalTasksCount, setTotalTasksCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Company[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  // 区分用户是否真的没有任务 vs 搜索结果为空
  const [userHasNoTasks, setUserHasNoTasks] = useState(false);
  
  // 用户状态
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // 筛选器
  const [taskNameFilter, setTaskNameFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [usernameFilter, setUsernameFilter] = useState(''); // 管理员用户名搜索
  
  // 新建任务模态框
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [newTaskForm, setNewTaskForm] = useState({
    taskName: '',
    taskType: 'enterprise' as 'enterprise' | 'industry',
    companies: [] as Company[],
    industryName: '' // 新增行业名称字段
  });

  // 获取用户信息
  const fetchUserInfo = async () => {
    try {
      const response = await fetch('/api/user/status');
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.isLoggedIn && data.data) {
          setUser(data.data);
          setIsLoggedIn(true);
          return true; // 返回登录成功状态
        } else {
          setIsLoggedIn(false);
          setUser(null);
          return false;
        }
      } else {
        setIsLoggedIn(false);
        setUser(null);
        return false;
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
      setIsLoggedIn(false);
      setUser(null);
      return false;
    }
  };

  // 获取任务列表
  const fetchTasks = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(taskNameFilter && { taskName: taskNameFilter }),
        ...(statusFilter && { status: statusFilter }),
        ...(user?.userType === 'admin' && usernameFilter && { username: usernameFilter })
      });

      const response = await fetch(`/api/tasks/list?${params}`);
      const data: TaskListResponse = await response.json();

      if (data.success) {
        setTasks(data.data.tasks);
        setTotalTasks(data.data.total);
        setTotalPages(data.data.totalPages);
        
        // 判断用户是否真的没有任务：只有在没有任何筛选条件时，且任务为空，才认为用户没有任务
        const hasFilters = taskNameFilter || statusFilter || (user?.userType === 'admin' && usernameFilter);
        setUserHasNoTasks(!hasFilters && data.data.tasks.length === 0);
      } else {
        console.error('获取任务列表失败');
      }
    } catch (error) {
      console.error('获取任务列表失败:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // 专门用于轮询的函数，只在没有筛选条件时才更新
  const fetchTasksForPolling = async () => {
    // 如果当前有筛选条件，则不进行轮询更新，避免干扰用户的筛选结果
    const hasFilters = taskNameFilter || statusFilter || (user?.userType === 'admin' && usernameFilter);
    if (hasFilters) {
      return;
    }

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      });

      const response = await fetch(`/api/tasks/list?${params}`);
      const data: TaskListResponse = await response.json();

      if (data.success) {
        setTasks(data.data.tasks);
        setTotalTasks(data.data.total);
        setTotalPages(data.data.totalPages);
        setUserHasNoTasks(data.data.tasks.length === 0);
      }
    } catch (error) {
      console.error('轮询获取任务列表失败:', error);
    }
  };

  // 获取任务统计
  const fetchTaskStats = async () => {
    try {
      const response = await fetch('/api/tasks/stats');
      const data: TaskStatsResponse = await response.json();
      if (data.success) {
        setTotalTasksCount(data.data.totalTasks);
      }
    } catch (error) {
      console.error('获取任务统计失败:', error);
    }
  };

  // 搜索企业
  const searchCompanies = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    // 检查用户是否已登录
    if (!isLoggedIn) {
      alert('请先登录后再进行搜索');
      router.push('/login');
      return;
    }

    try {
      const response = await fetch(`/api/tasks/search-companies?q=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (data.success) {
        setSearchResults(data.data);
        setShowSearchResults(true);
      }
    } catch (error) {
      console.error('搜索企业失败:', error);
    }
  };

  // 立即分析（搜索结果点击）
  const handleQuickAnalysis = (company: Company) => {
    if (!isLoggedIn) {
      // 未登录用户跳转到登录页
      router.push('/login');
      return;
    }
    
    // 已登录用户打开新建任务模态框
    setNewTaskForm({
      taskName: `${company.name}财务报告分析`,
      taskType: 'enterprise',
      companies: [company],
      industryName: ''
    });
    setShowNewTaskModal(true);
    setShowSearchResults(false);
    setSearchQuery('');
  };

  // 创建任务
  const createTask = async () => {
    // 检查用户是否已登录
    if (!isLoggedIn) {
      alert('请先登录后再创建分析任务');
      router.push('/login');
      return;
    }

    if (!newTaskForm.taskName || newTaskForm.companies.length === 0) {
      alert('请填写完整信息');
      return;
    }

    // 行业分析需要填写行业名称
    if (newTaskForm.taskType === 'industry' && !newTaskForm.industryName.trim()) {
      alert('行业分析请填写行业名称');
      return;
    }

    try {
      const response = await fetch('/api/tasks/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTaskForm),
      });

      const data = await response.json();

      if (data.success) {
        alert('任务创建成功');
        setShowNewTaskModal(false);
        setNewTaskForm({
          taskName: '',
          taskType: 'enterprise',
          companies: [],
          industryName: ''
        });
        fetchTasks();
        fetchTaskStats();
      } else {
        alert(data.message || '创建任务失败');
      }
    } catch (error) {
      console.error('创建任务失败:', error);
      alert('创建任务失败');
    }
  };

  // 删除任务
  const deleteTask = async (taskId: string) => {
    if (!confirm('确定要删除这个任务吗？')) {
      return;
    }

    try {
      const response = await fetch(`/api/tasks/${taskId}/delete`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        alert('任务删除成功');
        fetchTasks();
        fetchTaskStats();
      } else {
        alert(data.message || '删除任务失败');
      }
    } catch (error) {
      console.error('删除任务失败:', error);
      alert('删除任务失败');
    }
  };

  // 重新分析任务
  const restartTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/restart`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        alert('重新分析已启动');
        fetchTasks();
      } else {
        alert(data.message || '重新分析失败');
      }
    } catch (error) {
      console.error('重新分析失败:', error);
      alert('重新分析失败');
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      const isLoggedIn = await fetchUserInfo();
      
      // 无论是否登录都获取任务统计信息
      fetchTaskStats();
      
      // 如果已登录，获取用户任务列表；如果未登录，显示空列表
      if (isLoggedIn) {
        fetchTasks();
      } else {
        // 未登录用户显示空的任务列表状态
        setTasks([]);
        setTotalTasks(0);
        setTotalPages(0);
        setUserHasNoTasks(false); // 未登录用户不显示"暂无任务"提示
        setLoading(false);
      }
    };
    
    initializeData();
  }, []);

  // 当登录状态或筛选条件改变时重新获取任务
  useEffect(() => {
    if (isLoggedIn) {
      fetchTasks();
    }
  }, [isLoggedIn, currentPage, taskNameFilter, statusFilter, usernameFilter]);

  // 添加实时更新获取任务状态
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    // 只有在用户已登录时才开启轮询
    if (isLoggedIn) {
      console.log('开启任务状态轮询');
      intervalId = setInterval(() => {
        // 使用专门的轮询函数，避免干扰用户的筛选结果
        fetchTasksForPolling();
      }, 5000);
    }

    // 清理定时器
    return () => {
      if (intervalId) {
        console.log('清理任务状态轮询');
        clearInterval(intervalId);
      }
    };
  }, [isLoggedIn, taskNameFilter, statusFilter, usernameFilter, currentPage]);

  // 添加企业到新任务
  const addCompanyToTask = (company: Company) => {
    // 企业分析只能选择一个企业
    if (newTaskForm.taskType === 'enterprise') {
      setNewTaskForm(prev => ({
        ...prev,
        companies: [company],
        taskName: prev.taskName || `${company.name}财务报告分析`
      }));
    } else {
      // 行业分析可选择多个企业
      if (!newTaskForm.companies.find(c => c.code === company.code)) {
        setNewTaskForm(prev => ({
          ...prev,
          companies: [...prev.companies, company]
        }));
      }
    }
    setShowSearchResults(false);
    setSearchQuery('');
  };

  // 从新任务中移除企业
  const removeCompanyFromTask = (companyCode: string) => {
    setNewTaskForm(prev => ({
      ...prev,
      companies: prev.companies.filter(c => c.code !== companyCode)
    }));
  };

  // 获取状态显示
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'analyzing':
        return { text: '分析中', className: 'bg-gradient-to-r from-amber-500 to-orange-500' };
      case 'completed':
        return { text: '分析完成', className: 'bg-gradient-to-r from-green-500 to-emerald-500' };
      case 'error':
        return { text: '分析出错', className: 'bg-gradient-to-r from-red-500 to-rose-500' };
      default:
        return { text: status, className: 'bg-gray-500' };
    }
  };

  // 获取节点状态显示
  const getNodeStatus = (nodeStatus: string) => {
    if (nodeStatus === 'completed') {
      return { icon: '✓', className: 'bg-gradient-to-r from-green-500 to-emerald-500' };
    } else if (nodeStatus === 'error') {
      return { icon: '✗', className: 'bg-red-500' };
    } else if (nodeStatus === 'in_progress') {
      return { icon: '●', className: 'bg-gradient-to-r from-amber-500 to-orange-500 animate-pulse' };
    } else {
      return { icon: '○', className: 'bg-gray-500' };
    }
  };

  const clearFilters = () => {
    setTaskNameFilter('');
    setStatusFilter('');
    setUsernameFilter('');
  };

  // 判断是否可以选择行业分析
  const canSelectIndustryAnalysis = () => {
    return user?.userType === 'professional' || user?.userType === 'admin';
  };

  // 获取任务数量限制提示
  const getTaskLimitHint = () => {
    if (!user) return '';
    if (user.userType === 'free') return `免费版用户最多创建2个任务（当前${totalTasks}/2）`;
    if (user.userType === 'professional') return `专业版用户最多创建50个任务（当前${totalTasks}/50）`;
    return '管理员用户无任务数量限制';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-green-900">
      <TopHeader />
      
      <div className="container mx-auto px-4 py-8 pt-20">
        {/* 统计信息展示区域 - 超紧凑单行设计 */}
        <div className="flex justify-center mb-4">
          <div className="relative group cursor-default">
            {/* 主内容容器 */}
            <div className="inline-flex items-center px-6 py-2.5 bg-black/40 rounded-lg border border-purple-500/20 backdrop-blur-sm transition-all duration-300 hover:border-purple-400/40 hover:bg-black/60">
              {/* 左侧小图标 */}
              <div className="mr-3 relative">
                <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-green-500 rounded-md flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4"></path>
                  </svg>
                </div>
                {/* 图标光晕 */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-green-400 rounded-md opacity-0 group-hover:opacity-40 blur-sm transition-opacity duration-300"></div>
              </div>
              
              {/* 文字内容 */}
              <div className="flex items-baseline space-x-1.5">
                <span className="text-gray-300 text-sm font-medium transition-colors duration-300 group-hover:text-white">已生成</span>
                <div className="relative">
                  <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-green-400 bg-clip-text text-transparent transition-transform duration-300 group-hover:scale-105">
                    {(totalTasksCount + 1000).toLocaleString()}
                  </span>
                  {/* 数字发光效果 */}
                  <div className="absolute inset-0 text-xl font-bold text-purple-400/30 blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {(totalTasksCount + 1000).toLocaleString()}
                  </div>
                </div>
                <span className="text-gray-300 text-sm font-medium transition-colors duration-300 group-hover:text-white">个财报AI分析任务</span>
              </div>
              
              {/* 分隔点 */}
              <div className="mx-4 w-1 h-1 bg-purple-400/60 rounded-full animate-pulse"></div>
              
              {/* 实时更新状态 */}
              <div className="flex items-center space-x-1.5">
                <div className="relative">
                  <svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  </svg>
                  {/* 闪电动画 */}
                  <div className="absolute inset-0 animate-ping opacity-60">
                    <svg className="w-3.5 h-3.5 text-green-400/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                    </svg>
                  </div>
                </div>
                <span className="text-green-400 text-xs font-medium">实时更新</span>
              </div>
              
              {/* 底部流光效果 */}
              <div className="absolute bottom-0 left-0 w-full h-0.5 overflow-hidden rounded-b-lg">
                <div className="w-full h-full bg-gradient-to-r from-transparent via-purple-400/80 to-transparent transform translate-x-[-100%] animate-[shimmer_2.5s_ease-in-out_infinite]"></div>
              </div>
            </div>
            
            {/* 外围微光 */}
            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-500/10 to-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur scale-110"></div>
          </div>
        </div>

        <style jsx>{`
          @keyframes shimmer {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(100%);
            }
          }
        `}</style>

        {/* 搜索框 - 有数据时正常显示，无数据时居中大尺寸 */}
        {isLoggedIn && !userHasNoTasks ? (
          <div className="relative mb-8">
            <div className="flex items-center bg-black bg-opacity-40 rounded-xl border border-purple-500/30 p-4">
              <svg className="w-6 h-6 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
              <input
                type="text"
                placeholder="搜索企业名称或股票代码..."
                className="flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none text-lg"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  searchCompanies(e.target.value);
                }}
              />
            </div>
            
            {/* 搜索结果下拉框 */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-black bg-opacity-90 border border-purple-500/30 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto">
                {searchResults.map((company, index) => (
                  <div key={index} className="flex items-center justify-between p-4 hover:bg-purple-500/20 transition-all border-b border-gray-700 last:border-b-0">
                    <div className="flex-1">
                      <div className="text-white font-medium">{company.name}</div>
                      <div className="text-gray-400 text-sm">{company.code}</div>
                    </div>
                    <button 
                      onClick={() => handleQuickAnalysis(company)}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-green-600 hover:from-purple-700 hover:to-green-700 text-white rounded-lg text-sm transition-all"
                    >
                      立即分析
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex justify-center mb-12">
            <div className="relative w-full max-w-4xl">
              <div className="flex items-center bg-black bg-opacity-40 rounded-2xl border border-purple-500/30 p-8 shadow-2xl">
                <svg className="w-8 h-8 text-gray-400 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
                <input
                  type="text"
                  placeholder="搜索企业名称或股票代码，开始您的财报分析之旅..."
                  className="flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none text-2xl font-light"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    searchCompanies(e.target.value);
                  }}
                />
              </div>
              
              {/* 搜索结果下拉框 */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-black bg-opacity-90 border border-purple-500/30 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto">
                  {searchResults.map((company, index) => (
                    <div key={index} className="flex items-center justify-between p-4 hover:bg-purple-500/20 transition-all border-b border-gray-700 last:border-b-0">
                      <div className="flex-1">
                        <div className="text-white font-medium">{company.name}</div>
                        <div className="text-gray-400 text-sm">{company.code}</div>
                      </div>
                      <button 
                        onClick={() => handleQuickAnalysis(company)}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-green-600 hover:from-purple-700 hover:to-green-700 text-white rounded-lg text-sm transition-all"
                      >
                        立即分析
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}



        {/* 操作区域 - 仅在非空状态时显示 */}
        {isLoggedIn && !userHasNoTasks && (
        <div className="flex justify-between items-end mb-8">
          {/* 新建分析任务按钮 */}
          <div className="flex flex-col">
            <button 
              onClick={() => isLoggedIn ? setShowNewTaskModal(true) : router.push('/login')}
              disabled={!isLoggedIn}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-green-600 hover:from-purple-700 hover:to-green-700 text-white font-bold rounded-xl transition-all hover:shadow-lg hover:shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              新建分析任务
            </button>
            {isLoggedIn && user && (
              <p className="text-xs text-gray-400 mt-2">{getTaskLimitHint()}</p>
            )}
          </div>
          
          {/* 筛选器 */}
          <div className="flex items-center space-x-4 px-6 py-3 bg-black bg-opacity-40 rounded-xl border border-purple-500/30">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-300 whitespace-nowrap">任务名称</label>
              <input 
                type="text" 
                placeholder="输入名称..."
                className="w-32 px-3 py-2 bg-black bg-opacity-40 border border-purple-500/30 rounded-lg text-white text-sm placeholder-gray-400 focus:border-green-500 focus:outline-none transition-all"
                value={taskNameFilter}
                onChange={(e) => setTaskNameFilter(e.target.value)}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-300 whitespace-nowrap">任务状态</label>
              <select 
                className="w-28 px-3 py-2 bg-black bg-opacity-40 border border-purple-500/30 rounded-lg text-white text-sm focus:border-green-500 focus:outline-none transition-all"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">全部状态</option>
                <option value="analyzing">分析中</option>
                <option value="completed">分析完成</option>
                <option value="error">分析出错</option>
              </select>
            </div>

            {/* 管理员用户名搜索 */}
            {user?.userType === 'admin' && (
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-300 whitespace-nowrap">用户名</label>
                <input 
                  type="text" 
                  placeholder="搜索用户..."
                  className="w-32 px-3 py-2 bg-black bg-opacity-40 border border-purple-500/30 rounded-lg text-white text-sm placeholder-gray-400 focus:border-green-500 focus:outline-none transition-all"
                  value={usernameFilter}
                  onChange={(e) => setUsernameFilter(e.target.value)}
                />
              </div>
            )}
            
            <button 
              onClick={clearFilters}
              className="px-4 py-2 border-2 border-purple-500 text-purple-300 hover:bg-purple-500 hover:text-white rounded-lg text-sm transition-all"
            >
              清空筛选
            </button>
            
            {/* 实时更新状态指示器 */}
            <div className="flex items-center space-x-2 px-3 py-2 bg-green-500/10 rounded-lg border border-green-500/30">
              <svg className="w-4 h-4 text-green-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
              <span className="text-green-400 text-xs font-medium">实时更新</span>
            </div>
          </div>
        </div>
        )}



        {/* 任务列表 */}
        {!isLoggedIn ? (
          <div className="text-center py-16">
            <svg className="w-24 h-24 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4"></path>
            </svg>
            <h3 className="text-2xl font-semibold text-gray-400 mb-2">暂无分析任务</h3>
            <p className="text-gray-500 mb-6">登录后即可开始您的财报分析之旅</p>
            <button 
              onClick={() => router.push('/login')}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-green-600 hover:from-purple-700 hover:to-green-700 text-white font-bold rounded-xl transition-all"
            >
              立即登录
            </button>
          </div>
        ) : loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            <p className="text-gray-400 mt-4">加载中...</p>
          </div>
        ) : userHasNoTasks ? (
          <div className="text-center py-16">
            <svg className="w-24 h-24 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4"></path>
            </svg>
            <h3 className="text-2xl font-semibold text-gray-400 mb-2">还没有分析任务</h3>
            <p className="text-gray-500 mb-6">搜索企业开始您的第一个财报分析</p>
            <button 
              onClick={() => setShowNewTaskModal(true)}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-green-600 hover:from-purple-700 hover:to-green-700 text-white font-bold rounded-xl transition-all hover:shadow-lg hover:shadow-purple-500/30 text-lg"
            >
              <svg className="w-6 h-6 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              创建第一个分析任务
            </button>
            {user && (
              <p className="text-xs text-gray-400 mt-4">{getTaskLimitHint()}</p>
            )}
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            <h3 className="text-xl font-medium text-gray-400 mb-2">未找到匹配的任务</h3>
            <p className="text-gray-500 mb-4">请尝试调整筛选条件或搜索关键词</p>
            <button 
              onClick={clearFilters}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-all"
            >
              清空筛选条件
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => {
              const statusDisplay = getStatusDisplay(task.status);
              const analysisNodes = task.analysisNodes;
              
              return (
                <div 
                  key={task.taskId}
                  className="bg-black bg-opacity-40 p-6 rounded-xl border border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/20 transition-all"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-lg font-bold text-white">{task.taskName}</h3>
                        <span className={`text-white px-3 py-1 rounded-full text-xs font-medium ${statusDisplay.className}`}>
                          {statusDisplay.text}
                        </span>
                        {user?.userType === 'admin' && task.user && (
                          <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
                            {task.user.username}
                          </span>
                        )}
                      </div>
                      
                      {/* 企业标签 */}
                      <div className="flex items-center space-x-2 mb-3">
                        <span className="text-xs text-gray-400">企业:</span>
                        <div className="flex items-center space-x-1 flex-wrap">
                          {task.companies.slice(0, 5).map((company, index) => (
                            <span key={index} className="inline-flex items-center bg-gray-600 text-white px-2 py-0.5 rounded text-xs">
                              {company.name}
                            </span>
                          ))}
                          {task.companies.length > 5 && (
                            <span className="inline-flex items-center bg-gray-700 text-white px-2 py-0.5 rounded text-xs">
                              +{task.companies.length - 5}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <span>开始时间: {new Date(task.startTime).toLocaleString()}</span>
                        <span>结束时间: {task.endTime ? new Date(task.endTime).toLocaleString() : '--'}</span>
                      </div>
                      
                      {task.errorReason && (
                        <p className="text-red-300 text-sm mt-2">错误原因: {task.errorReason}</p>
                      )}
                    </div>
                    
                    {/* 中间进度节点 */}
                    <div className="flex items-center mx-8">
                      <div className="flex items-center space-x-3">
                        {/* 采集数据节点 */}
                        <div className="flex flex-col items-center">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                            getNodeStatus(analysisNodes.collect_data).className
                          }`}>
                            {getNodeStatus(analysisNodes.collect_data).icon}
                          </div>
                          <span className="text-xs text-gray-300 mt-1">采集数据</span>
                        </div>
                        
                        <div className="w-6 h-0.5 bg-gradient-to-r from-purple-600 to-green-600 opacity-60"></div>
                        
                        {/* 计算数据节点 */}
                        <div className="flex flex-col items-center">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                            getNodeStatus(analysisNodes.calculate_data).className
                          }`}>
                            {getNodeStatus(analysisNodes.calculate_data).icon}
                          </div>
                          <span className="text-xs text-gray-300 mt-1">计算数据</span>
                        </div>
                        

                      </div>
                    </div>
                    
                    {/* 操作按钮 */}
                    <div className="flex space-x-2">
                      {task.status === 'completed' && (
                        <button 
                          onClick={() => router.push(`/taskdetails/${task.taskId}`)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition-all"
                        >
                          查看详情
                        </button>
                      )}
                      {task.status === 'error' && (
                        <button 
                          onClick={() => restartTask(task.taskId)}
                          className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-sm transition-all"
                        >
                          重新分析
                        </button>
                      )}
                      {(task.status === 'completed' || task.status === 'error') && (
                        <button 
                          onClick={() => deleteTask(task.taskId)}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm transition-all"
                        >
                          删除任务
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 分页 */}
        {isLoggedIn && tasks.length > 0 && totalPages > 1 && (
          <div className="flex justify-center items-center space-x-4 mt-8">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg transition-all"
            >
              上一页
            </button>
            <span className="text-white">
              第 {currentPage} 页，共 {totalPages} 页
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg transition-all"
            >
              下一页
            </button>
          </div>
        )}

        {/* 新建任务模态框 */}
        {showNewTaskModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-xl p-6 w-full max-w-2xl border border-purple-500/30">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">新建分析任务</h2>
                <button 
                  onClick={() => setShowNewTaskModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* 任务名称 */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">任务名称</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-black bg-opacity-40 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:border-green-500 focus:outline-none transition-all"
                    placeholder="请输入任务名称"
                    value={newTaskForm.taskName}
                    onChange={(e) => setNewTaskForm(prev => ({ ...prev, taskName: e.target.value }))}
                  />
                </div>

                {/* 任务类型 */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">任务类型</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="taskType"
                        value="enterprise"
                        checked={newTaskForm.taskType === 'enterprise'}
                        onChange={(e) => setNewTaskForm(prev => ({ ...prev, taskType: e.target.value as 'enterprise' | 'industry' }))}
                        className="mr-2"
                      />
                      <span className="text-white">企业分析</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="taskType"
                        value="industry"
                        checked={newTaskForm.taskType === 'industry'}
                        onChange={(e) => setNewTaskForm(prev => ({ ...prev, taskType: e.target.value as 'enterprise' | 'industry' }))}
                        disabled={!canSelectIndustryAnalysis()}
                        className="mr-2"
                      />
                      <span className={`${canSelectIndustryAnalysis() ? 'text-white' : 'text-gray-500'}`}>
                        行业分析
                        {!canSelectIndustryAnalysis() && (
                          <span className="text-xs text-gray-400 ml-1">(仅专业版)</span>
                        )}
                      </span>
                    </label>
                  </div>
                </div>

                {/* 行业名称 */}
                {newTaskForm.taskType === 'industry' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">行业名称</label>
                    <input
                      type="text"
                      value={newTaskForm.industryName}
                      onChange={(e) => setNewTaskForm(prev => ({ ...prev, industryName: e.target.value }))}
                      className="w-full px-4 py-2 bg-black bg-opacity-40 border border-purple-500/30 rounded-lg text-white focus:border-green-500 focus:outline-none transition-all"
                      placeholder="请输入行业名称，如：互联网行业"
                    />
                  </div>
                )}

                {/* 选择企业 */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">选择企业</label>
                  <div className="space-y-3">
                    {/* 已选择的企业 */}
                    {newTaskForm.companies.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {newTaskForm.companies.map((company, index) => (
                          <span key={index} className="inline-flex items-center bg-purple-600 text-white px-3 py-1 rounded-full text-sm">
                            {company.name}
                            <button
                              onClick={() => removeCompanyFromTask(company.code)}
                              className="ml-2 text-purple-200 hover:text-white"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                              </svg>
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {/* 企业搜索框 */}
                    <div className="relative">
                      <input
                        type="text"
                        className="w-full px-4 py-3 bg-black bg-opacity-40 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:border-green-500 focus:outline-none transition-all"
                        placeholder="搜索并选择企业..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          searchCompanies(e.target.value);
                        }}
                      />
                      
                      {/* 搜索结果 */}
                      {showSearchResults && searchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-black bg-opacity-90 border border-purple-500/30 rounded-lg shadow-xl z-10 max-h-48 overflow-y-auto">
                          {searchResults.map((company, index) => (
                            <div 
                              key={index} 
                              onClick={() => addCompanyToTask(company)}
                              className="flex items-center justify-between p-3 hover:bg-purple-500/20 transition-all cursor-pointer border-b border-gray-700 last:border-b-0"
                            >
                              <div>
                                <div className="text-white font-medium">{company.name}</div>
                                <div className="text-gray-400 text-sm">{company.code}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 按钮 */}
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => setShowNewTaskModal(false)}
                    className="px-6 py-3 border-2 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white rounded-lg transition-all"
                  >
                    取消
                  </button>
                  <button
                    onClick={createTask}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-green-600 hover:from-purple-700 hover:to-green-700 text-white font-bold rounded-lg transition-all"
                  >
                    创建任务
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 