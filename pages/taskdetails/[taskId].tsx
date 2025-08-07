import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import TopHeader from '../../components/TopHeader';
import { useAuth } from '../../lib/auth';
import { getTaskDetails, getFinancialData, getFinancialIndicators } from '../../lib/api';
import type { TaskDetails, FinancialData, FinancialIndicator } from '../../lib/api';
import FinancialDataTable from '../../components/FinancialDataTable';
import StreamingAIAnalysis from '../../components/StreamingAIAnalysis';
import IndicatorDetailModal from '../../components/IndicatorDetailModal';

// 数据缓存接口
interface CacheData {
  financialData?: FinancialData[];
  financialIndicators?: FinancialIndicator[];
  timestamp: number;
}

// 全局缓存对象
const dataCache = new Map<string, CacheData>();

// 缓存有效期（5分钟）
const CACHE_DURATION = 5 * 60 * 1000;

export default function TaskDetails() {
  const router = useRouter();
  const { taskId } = router.query;
  const { user, loading: authLoading } = useAuth();
  const [taskDetails, setTaskDetails] = useState<TaskDetails | null>(null);
  const [selectedNav, setSelectedNav] = useState('资产负债表');
  const [timeRange, setTimeRange] = useState('3年');
  const [reportPeriods, setReportPeriods] = useState('年报');
  const [indicatorReportPeriods, setIndicatorReportPeriods] = useState('年报指标');
  const [showSync, setShowSync] = useState(false);
  const [financialData, setFinancialData] = useState<FinancialData[]>([]);
  const [financialIndicators, setFinancialIndicators] = useState<FinancialIndicator[]>([]);

  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedIndicator, setSelectedIndicator] = useState<{
    name: string;
    displayName: string;
    dataType: 'financial_data' | 'financial_indicators';
  } | null>(null);

  // 生成缓存key
  const generateCacheKey = (nav: string, timeRange: string, reportPeriod: string) => {
    return `${taskId}-${nav}-${timeRange}-${reportPeriod}`;
  };

  // 检查缓存是否有效
  const isCacheValid = (timestamp: number) => {
    return Date.now() - timestamp < CACHE_DURATION;
  };

  // 从缓存获取数据
  const getFromCache = (cacheKey: string): CacheData | null => {
    const cached = dataCache.get(cacheKey);
    if (cached && isCacheValid(cached.timestamp)) {
      return cached;
    }
    if (cached) {
      // 缓存过期，删除
      dataCache.delete(cacheKey);
    }
    return null;
  };

  // 保存数据到缓存
  const saveToCache = (cacheKey: string, data: Partial<CacheData>) => {
    const existing = dataCache.get(cacheKey) || { timestamp: Date.now() };
    dataCache.set(cacheKey, {
      ...existing,
      ...data,
      timestamp: Date.now()
    });
  };

  useEffect(() => {
    console.log('TaskDetails - 认证状态:', { authLoading, user });
    if (authLoading) return;

    if (!user) {
      console.log('TaskDetails - 用户未登录，跳转到登录页');
      router.push('/login');
      return;
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (taskId && user) {
      console.log('TaskDetails - 开始获取任务数据');
      fetchTaskDetails();
      fetchInitialData();
    }
  }, [taskId, user]);

  // 分离筛选条件变化和导航变化的逻辑
  useEffect(() => {
    if (taskId && user) {
      fetchData();
    }
  }, [taskId, timeRange, reportPeriods, indicatorReportPeriods, user]);

  // 导航变化时尝试使用缓存
  useEffect(() => {
    if (taskId && user) {
      loadDataForNav(selectedNav);
    }
  }, [selectedNav]);

  const fetchTaskDetails = async () => {
    try {
      console.log('TaskDetails - 获取任务详情:', taskId);
      const data = await getTaskDetails(taskId as string);
      setTaskDetails(data);
    } catch (error) {
      console.error('获取任务详情失败:', error);
    }
  };

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      // 将前端显示的报告期转换为后端期望的格式
      const reportPeriodMap: { [key: string]: string } = {
        'Q1': 'Q1',
        '年中': 'Q2', 
        'Q3': 'Q3',
        '年报': 'Q4'
      };
      
      const mappedReportPeriod = reportPeriodMap[reportPeriods];
      const cacheKey = generateCacheKey('资产负债表', timeRange, mappedReportPeriod);
      
      // 检查缓存
      const cached = getFromCache(cacheKey);
      if (cached?.financialData) {
        setFinancialData(cached.financialData);
        setLoading(false);
        return;
      }
      
      const data = await getFinancialData({
        taskId: taskId as string,
        type: '资产负债表',
        timeRange,
        reportPeriods: [mappedReportPeriod],
      });
      
      setFinancialData(data);
      saveToCache(cacheKey, { financialData: data });
    } catch (error) {
      console.error('获取财务数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDataForNav = async (nav: string) => {
    if (!taskId || !user) return;

    const currentReportPeriod = nav.includes('指标') ? indicatorReportPeriods : reportPeriods;
    const cacheKey = generateCacheKey(nav, timeRange, currentReportPeriod);
    
    // 检查缓存
    const cached = getFromCache(cacheKey);
    if (cached) {
      if (nav.includes('指标') && cached.financialIndicators) {
        setFinancialIndicators(cached.financialIndicators);
        return;
      } else if (!nav.includes('指标') && !nav.includes('AI分析建议') && cached.financialData) {
        setFinancialData(cached.financialData);
        return;
      }
    }

    // 缓存中没有数据，显示加载状态并获取数据
    fetchDataFromAPI(nav, timeRange, currentReportPeriod);
  };

  const fetchData = async () => {
    if (!taskId || !user) return;
    
    const currentReportPeriod = selectedNav.includes('指标') ? indicatorReportPeriods : reportPeriods;
    const cacheKey = generateCacheKey(selectedNav, timeRange, currentReportPeriod);
    
    // 检查缓存
    const cached = getFromCache(cacheKey);
    if (cached) {
      if (selectedNav.includes('指标') && cached.financialIndicators) {
        setFinancialIndicators(cached.financialIndicators);
        return;
      } else if (!selectedNav.includes('指标') && !selectedNav.includes('AI分析建议') && cached.financialData) {
        setFinancialData(cached.financialData);
        return;
      }
    }

    // 缓存中没有数据，从API获取
    fetchDataFromAPI(selectedNav, timeRange, currentReportPeriod);
  };

  const fetchDataFromAPI = async (nav: string, timeRange: string, reportPeriod: string) => {
    try {
      setLoading(true);
      const cacheKey = generateCacheKey(nav, timeRange, reportPeriod);
      
      if (nav.includes('AI分析建议')) {
        // AI分析建议现在使用流式组件，不需要在这里处理
        return;
      } else if (nav.includes('指标')) {
        // 财务指标使用专门的报告期映射
        const indicatorPeriodMap: { [key: string]: string } = {
          '最新一期': 'lastdate',
          '年报指标': 'Q4'
        };
        
        const mappedIndicatorPeriod = indicatorPeriodMap[reportPeriod];
        
        const data = await getFinancialIndicators({
          taskId: taskId as string,
          type: nav,
          timeRange,
          reportPeriods: [mappedIndicatorPeriod],
        });
        setFinancialIndicators(data);
        saveToCache(cacheKey, { financialIndicators: data });
      } else {
        // 财务数据使用原有的报告期映射
        const reportPeriodMap: { [key: string]: string } = {
          'Q1': 'Q1',
          '年中': 'Q2', 
          'Q3': 'Q3',
          '年报': 'Q4'
        };
        
        const mappedReportPeriod = reportPeriodMap[reportPeriod];
        
        const data = await getFinancialData({
          taskId: taskId as string,
          type: nav,
          timeRange,
          reportPeriods: [mappedReportPeriod],
        });
        setFinancialData(data);
        saveToCache(cacheKey, { financialData: data });
      }
    } catch (error) {
      console.error('获取数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNavChange = (nav: string) => {
    setSelectedNav(nav);
  };

  const handleIndicatorClick = (indicatorName: string, indicatorDisplayName: string, dataType: 'financial_data' | 'financial_indicators') => {
    setSelectedIndicator({
      name: indicatorName,
      displayName: indicatorDisplayName,
      dataType
    });
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedIndicator(null);
  };

  // 清除所有缓存的函数（用于调试或强制刷新）
  const clearAllCache = () => {
    dataCache.clear();
    fetchData(); // 重新获取当前数据
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-300">正在验证登录状态...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-300">正在跳转到登录页面...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <TopHeader />
      
      {/* 主要内容区域 */}
      <div className="pt-16 flex">
        {/* 固定左侧导航栏 */}
        <div className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-80 bg-gradient-to-b from-slate-800/90 to-purple-900/90 backdrop-blur-md border-r border-purple-500/30 overflow-y-auto">
          <div className="p-6">
            <nav className="space-y-6">
              {/* 财报数据 */}
              <div>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center relative">
                  <div className="absolute -left-2 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-400 to-green-400 rounded-full"></div>
                  <div className="bg-gradient-to-r from-purple-500/20 to-green-500/20 rounded-lg p-2 mr-3 border border-purple-400/30">
                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gradient bg-gradient-to-r from-purple-300 to-green-300 bg-clip-text text-transparent">财报数据</span>
                    <span className="text-xs text-gray-400 font-normal">Financial Statements</span>
                  </div>
                </h3>
                <ul className="space-y-2">
                  {[
                    { name: '资产负债表', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 8h1m-1-4h1m4 4h1m-1-4h1' },
                    { name: '利润表', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
                    { name: '现金流表', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' }
                  ].map((item) => (
                    <li key={item.name}>
                      <button
                        className={`w-full text-left px-4 py-3 rounded-lg transition-all group ${
                          selectedNav === item.name 
                            ? 'bg-gradient-to-r from-purple-600 to-green-600 text-white shadow-lg transform scale-105' 
                            : 'text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-purple-500/30 hover:to-green-500/30 hover:transform hover:scale-102'
                        }`}
                        onClick={() => handleNavChange(item.name)}
                      >
                        <div className="flex items-center">
                          <div className={`p-1.5 rounded-md mr-3 transition-all ${
                            selectedNav === item.name
                              ? 'bg-white/20'
                              : 'bg-gray-600/30 group-hover:bg-white/10'
                          }`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon}></path>
                            </svg>
                          </div>
                          <span className="font-medium">{item.name}</span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 财报指标 */}
              <div>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center relative">
                  <div className="absolute -left-2 top-0 bottom-0 w-1 bg-gradient-to-b from-green-400 to-blue-400 rounded-full"></div>
                  <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-lg p-2 mr-3 border border-green-400/30">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                    </svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gradient bg-gradient-to-r from-green-300 to-blue-300 bg-clip-text text-transparent">财报指标</span>
                    <span className="text-xs text-gray-400 font-normal">Financial Indicators</span>
                  </div>
                </h3>
                <ul className="space-y-2">
                  {[
                    { name: '盈利能力指标', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
                    { name: '现金流量指标', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
                    { name: '偿债能力指标', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
                    { name: '运营效率指标', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
                    { name: '成长能力指标', icon: 'M7 11l5-5m0 0l5 5m-5-5v12' },
                    { name: '杜邦分析指标', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
                    { name: '财务质量指标', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' },
                    { name: '市场估值指标', icon: 'M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
                    { name: '财务风险指标', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
                  ].map((indicator) => (
                    <li key={indicator.name}>
                      <button
                        className={`w-full text-left px-4 py-3 rounded-lg transition-all group ${
                          selectedNav === indicator.name 
                            ? 'bg-gradient-to-r from-purple-600 to-green-600 text-white shadow-lg transform scale-105' 
                            : 'text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-purple-500/30 hover:to-green-500/30 hover:transform hover:scale-102'
                        }`}
                        onClick={() => handleNavChange(indicator.name)}
                      >
                        <div className="flex items-center">
                          <div className={`p-1.5 rounded-md mr-3 transition-all ${
                            selectedNav === indicator.name
                              ? 'bg-white/20'
                              : 'bg-gray-600/30 group-hover:bg-white/10'
                          }`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={indicator.icon}></path>
                            </svg>
                          </div>
                          <span className="font-medium">{indicator.name}</span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* AI分析建议 */}
              <div>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center relative">
                  <div className="absolute -left-2 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-purple-400 rounded-full"></div>
                  <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg p-2 mr-3 border border-blue-400/30">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                    </svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gradient bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">AI分析建议</span>
                    <span className="text-xs text-gray-400 font-normal">AI Analysis</span>
                  </div>
                </h3>
                <ul className="space-y-2">
                  {[
                    { name: '财务数据AI分析建议', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
                    { name: '财务指标AI分析建议', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' }
                  ].map((item) => (
                    <li key={item.name}>
                      <button
                        className={`w-full text-left px-4 py-3 rounded-lg transition-all group ${
                          selectedNav === item.name 
                            ? 'bg-gradient-to-r from-purple-600 to-green-600 text-white shadow-lg transform scale-105' 
                            : 'text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-purple-500/30 hover:to-green-500/30 hover:transform hover:scale-102'
                        }`}
                        onClick={() => handleNavChange(item.name)}
                      >
                        <div className="flex items-center">
                          <div className={`p-1.5 rounded-md mr-3 transition-all ${
                            selectedNav === item.name
                              ? 'bg-white/20'
                              : 'bg-gray-600/30 group-hover:bg-white/10'
                          }`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon}></path>
                            </svg>
                          </div>
                          <span className="font-medium">{item.name}</span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </nav>
          </div>
        </div>

        {/* 右侧主内容区域 */}
        <div className="ml-80 flex-1 p-6">
          {/* 任务信息卡片 */}
          {taskDetails && (
            <div className="bg-gradient-to-r from-slate-800/90 to-purple-900/90 backdrop-blur-md rounded-2xl border border-purple-500/30 p-6 mb-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">{taskDetails.taskName}</h1>
                  <div className="flex items-center space-x-6 text-gray-300">
                    <div className="flex items-center">
                      <span className="text-purple-400 mr-2">所选公司:</span>
                      <div className="flex flex-wrap gap-1">
                        {taskDetails.companies && taskDetails.companies.map((company: any, index: number) => (
                          <span key={index} className="bg-purple-600/30 text-purple-200 px-2 py-1 rounded text-sm">
                            {company.name}
                          </span>
                        ))}
                      </div>
                    </div>
                    {taskDetails.taskType === 'industry' && taskDetails.industryName && (
                      <div className="flex items-center">
                        <span className="text-purple-400 mr-2">行业:</span>
                        <span className="bg-green-600/30 text-green-200 px-2 py-1 rounded text-sm">{taskDetails.industryName}</span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <span className="text-purple-400 mr-2">状态:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        taskDetails.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {taskDetails.status === 'completed' ? '分析完成' : 
                         taskDetails.status === 'analyzing' ? '分析中' : '分析出错'}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-purple-400 mr-2">创建时间:</span>
                      <span>{new Date(taskDetails.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400">当前分析</div>
                  <div className="text-xl font-bold text-white">{selectedNav}</div>
                </div>
              </div>
            </div>
          )}

          {/* 控制面板 */}
          {!selectedNav.includes('AI分析建议') && (
            <div className="bg-gradient-to-r from-slate-800/90 to-purple-900/90 backdrop-blur-md rounded-2xl border border-purple-500/30 p-6 mb-6 shadow-lg">
              <div className="flex flex-wrap gap-6 items-center">
                {/* 时间范围标签选择 */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">时间范围</label>
                  <div className="flex space-x-2">
                    {['3年', '5年', '10年'].map((range) => (
                      <button
                        key={range}
                        onClick={() => setTimeRange(range)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                          timeRange === range
                            ? 'bg-gradient-to-r from-purple-600 to-green-600 text-white shadow-lg'
                            : 'bg-slate-700/50 text-gray-300 hover:bg-slate-600/50 hover:text-white'
                        }`}
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 报告期选择 */}
                {selectedNav.includes('指标') ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">报告期</label>
                    <div className="flex space-x-2">
                      {['最新一期', '年报指标'].map((period) => (
                        <label key={period} className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="indicatorReportPeriods"
                            checked={indicatorReportPeriods === period}
                            onChange={() => setIndicatorReportPeriods(period)}
                            className="sr-only"
                          />
                          <div className={`px-4 py-2 rounded-lg font-medium transition-all ${
                            indicatorReportPeriods === period
                              ? 'bg-gradient-to-r from-purple-600 to-green-600 text-white shadow-lg'
                              : 'bg-slate-700/50 text-gray-300 hover:bg-slate-600/50 hover:text-white'
                          }`}>
                            {period}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">报告期</label>
                    <div className="flex space-x-2">
                      {['Q1', '年中', 'Q3', '年报'].map((period) => (
                        <label key={period} className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="reportPeriods"
                            checked={reportPeriods === period}
                            onChange={() => setReportPeriods(period)}
                            className="sr-only"
                          />
                          <div className={`px-4 py-2 rounded-lg font-medium transition-all ${
                            reportPeriods === period
                              ? 'bg-gradient-to-r from-purple-600 to-green-600 text-white shadow-lg'
                              : 'bg-slate-700/50 text-gray-300 hover:bg-slate-600/50 hover:text-white'
                          }`}>
                            {period}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* 同比显示开关 */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">显示选项</label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showSync}
                      onChange={(e) => setShowSync(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      showSync
                        ? 'bg-gradient-to-r from-purple-600 to-green-600 text-white shadow-lg'
                        : 'bg-slate-700/50 text-gray-300 hover:bg-slate-600/50 hover:text-white'
                    }`}>
                      展示同比
                    </div>
                  </label>
                </div>

                {/* 开发调试：清除缓存按钮 */}
                {process.env.NODE_ENV === 'development' && (
                  <button
                    onClick={clearAllCache}
                    className="px-2 py-1 text-xs rounded bg-red-600/30 text-red-300 hover:bg-red-500/50 hover:text-white transition-all"
                    title="清除所有缓存"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 数据表格区域 */}
          <div className="bg-gradient-to-r from-slate-800/90 to-purple-900/90 backdrop-blur-md rounded-2xl border border-purple-500/30 shadow-lg">
            <div className="p-6">
              <div className="max-w-full overflow-x-auto">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                    <p className="text-gray-300">加载中...</p>
                  </div>
                ) : selectedNav.includes('AI分析建议') ? (
                  <StreamingAIAnalysis
                    taskId={taskId as string}
                    analysisType={selectedNav === '财务数据AI分析建议' ? 'financial_data' : 'financial_indicators'}
                    title={selectedNav}
                    userType={user?.userType}
                    username={user?.username}
                  />
                ) : selectedNav.includes('指标') ? (
                  <FinancialDataTable 
                    data={financialIndicators} 
                    showSync={showSync} 
                    onIndicatorClick={handleIndicatorClick}
                    userType={user?.userType}
                    username={user?.username}
                    dataType="financial_indicators"
                  />
                ) : (
                  <FinancialDataTable 
                    data={financialData} 
                    showSync={showSync} 
                    onIndicatorClick={handleIndicatorClick}
                    userType={user?.userType}
                    username={user?.username}
                    dataType="financial_data"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 指标详细分析弹框 */}
      {selectedIndicator && (
        <IndicatorDetailModal
          isOpen={modalOpen}
          onClose={handleModalClose}
          indicatorName={selectedIndicator.name}
          indicatorDisplayName={selectedIndicator.displayName}
          taskId={taskId as string}
          dataType={selectedIndicator.dataType}
          userType={user?.userType}
          username={user?.username}
        />
      )}
    </div>
  );
} 