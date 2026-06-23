import React, { useState, useEffect, useCallback, useRef, startTransition } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { flushSync } from 'react-dom';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface TrendDataItem {
  date: string;
  value: number;
  formattedValue: string;
  unit: string;
  companyName: string;
  companyCode: string;
}

// 弹框数据缓存接口
interface ModalCacheData {
  trendData?: TrendDataItem[];
  aiAnalysis?: string;
  timestamp: number;
}

// 全局弹框缓存对象
const modalCache = new Map<string, ModalCacheData>();

// 缓存有效期（10分钟）
const MODAL_CACHE_DURATION = 10 * 60 * 1000;

interface IndicatorDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  indicatorName: string;
  indicatorDisplayName: string;
  taskId: string;
  dataType: 'financial_data' | 'financial_indicators';
  userType?: 'free' | 'premium' | 'admin';
  username?: string;
}

const IndicatorDetailModal: React.FC<IndicatorDetailModalProps> = ({
  isOpen,
  onClose,
  indicatorName,
  indicatorDisplayName,
  taskId,
  dataType,
  userType,
  username
}) => {
  const [activeTab, setActiveTab] = useState<'trend' | 'ai'>('trend');
  const [timeRange, setTimeRange] = useState('3年');
  const [reportPeriod, setReportPeriod] = useState(dataType === 'financial_indicators' ? '年报' : 'Q4');
  const [trendData, setTrendData] = useState<TrendDataItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRegenerateCount, setAiRegenerateCount] = useState(0);
  const [aiAnalysisStarted, setAiAnalysisStarted] = useState(false);
  
  // 使用ref来存储当前的AI分析内容，避免闭包问题
  const aiAnalysisRef = useRef('');
  
  // 检查用户权限
  const hasAiPermission = userType === 'premium' || userType === 'admin';

  // 生成缓存key
  const generateCacheKey = (type: 'trend' | 'ai') => {
    const baseKey = `${taskId}-${indicatorName}-${dataType}-${timeRange}-${reportPeriod}`;
    return `${baseKey}-${type}`;
  };

  // 检查缓存是否有效
  const isCacheValid = (timestamp: number) => {
    return Date.now() - timestamp < MODAL_CACHE_DURATION;
  };

  // 从缓存获取数据
  const getFromCache = (cacheKey: string): ModalCacheData | null => {
    const cached = modalCache.get(cacheKey);
    if (cached && isCacheValid(cached.timestamp)) {
      return cached;
    }
    if (cached) {
      // 缓存过期，删除
      modalCache.delete(cacheKey);
    }
    return null;
  };

  // 保存数据到缓存
  const saveToCache = (cacheKey: string, data: Partial<ModalCacheData>) => {
    const existing = modalCache.get(cacheKey) || { timestamp: Date.now() };
    modalCache.set(cacheKey, {
      ...existing,
      ...data,
      timestamp: Date.now()
    });
  };

  // 当弹框打开或筛选条件变化时，尝试使用缓存或获取数据
  useEffect(() => {
    if (isOpen) {
      loadTrendData();
    } else {
      // 模态框关闭时重置AI分析状态
      setAiAnalysisStarted(false);
      setAiAnalysis('');
      aiAnalysisRef.current = '';
      setAiRegenerateCount(0);
    }
  }, [isOpen, timeRange, reportPeriod]);

  // 当趋势数据加载完成且用户已开始AI分析时，自动触发AI分析
  useEffect(() => {
    if (aiAnalysisStarted && trendData.length > 0 && !aiLoading && !aiAnalysis) {
      fetchAiAnalysis();
    }
  }, [trendData, aiAnalysisStarted, aiLoading, aiAnalysis]);

  // 使用useCallback优化更新函数
  const updateAiAnalysis = useCallback((newContent: string) => {
    aiAnalysisRef.current += newContent;
    setAiAnalysis(aiAnalysisRef.current);
  }, []);

  // 加载趋势数据（优先使用缓存）
  const loadTrendData = () => {
    const cacheKey = generateCacheKey('trend');
    const cached = getFromCache(cacheKey);
    
    if (cached?.trendData) {
      setTrendData(cached.trendData);
      return;
    }

    // 缓存中没有数据，从API获取
    fetchTrendData();
  };

  // 获取趋势数据
  const fetchTrendData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/financial/indicator-trend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId,
          indicatorName,
          dataType,
          timeRange,
          reportPeriod: dataType === 'financial_indicators' ? '年报' : reportPeriod
        }),
      });

      const result = await response.json();
      if (result.success) {
        setTrendData(result.data);
        
        // 保存到缓存
        const cacheKey = generateCacheKey('trend');
        saveToCache(cacheKey, { trendData: result.data });
      } else {
        console.error('获取趋势数据失败:', result.message || '未知错误');
        
        // 检查是否是认证相关错误
        if (result.message && (
          result.message.includes('登录') || 
          result.message.includes('过期') || 
          result.message.includes('认证') ||
          result.message.includes('权限')
        )) {
          const shouldReload = confirm(`${result.message}\n\n是否跳转到登录页面重新登录？`);
          if (shouldReload) {
            window.location.href = '/login';
            return;
          }
        }
        
        alert(`获取趋势数据失败: ${result.message || '未知错误'}`);
      }
    } catch (error) {
      console.error('获取趋势数据时发生错误:', error);
      alert('获取趋势数据时发生网络错误，请检查网络连接或稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 加载AI分析（优先使用缓存）
  const loadAiAnalysis = () => {
    const cacheKey = generateCacheKey('ai');
    const cached = getFromCache(cacheKey);
    
    if (cached?.aiAnalysis) {
      setAiAnalysis(cached.aiAnalysis);
      aiAnalysisRef.current = cached.aiAnalysis;
      setAiAnalysisStarted(true);
      return;
    }

    // 只有在用户手动开始分析时才继续
    if (!aiAnalysisStarted) {
      return;
    }

    // 缓存中没有数据，检查是否有趋势数据
    if (trendData.length === 0) {
      // 先确保有趋势数据
      loadTrendData();
      return;
    }

    // 从API获取AI分析
    fetchAiAnalysis();
  };

  // 获取AI分析
  const fetchAiAnalysis = async () => {
    // 如果没有趋势数据，先获取趋势数据
    if (trendData.length === 0) {
      setLoading(true);
      try {
        const response = await fetch('/api/financial/indicator-trend', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            taskId,
            indicatorName,
            dataType,
            timeRange,
            reportPeriod: dataType === 'financial_indicators' ? '年报' : reportPeriod
          }),
        });

        const result = await response.json();
        if (result.success && result.data.length > 0) {
          setTrendData(result.data);
          
          // 保存趋势数据到缓存
          const trendCacheKey = generateCacheKey('trend');
          saveToCache(trendCacheKey, { trendData: result.data });
          
          // 使用获取到的数据进行AI分析
          await performAiAnalysis(result.data);
        } else {
          console.error('获取趋势数据失败:', result.message || '未知错误');
          
          // 检查是否是认证相关错误
          if (result.message && (
            result.message.includes('登录') || 
            result.message.includes('过期') || 
            result.message.includes('认证') ||
            result.message.includes('权限')
          )) {
            setAiAnalysis(`认证失败：${result.message}\n\n请重新登录后再试。`);
          } else {
            setAiAnalysis(`无法获取趋势数据，AI分析暂时不可用。\n\n错误信息: ${result.message || '未知错误'}`);
          }
        }
      } catch (error) {
        console.error('获取趋势数据时发生错误:', error);
        setAiAnalysis('获取趋势数据时发生网络错误，AI分析暂时不可用。请检查网络连接或稍后重试。');
      } finally {
        setLoading(false);
      }
    } else {
      // 如果已有趋势数据，直接进行AI分析
      await performAiAnalysis(trendData);
    }
  };

  // 执行AI分析 - 真正的流式处理
  const performAiAnalysis = async (data: TrendDataItem[]) => {
    setAiLoading(true);
    setAiAnalysis(''); // 清空之前的分析结果
    aiAnalysisRef.current = ''; // 同时清空ref

    try {
      // 从趋势数据中提取公司信息
      const companyName = data.length > 0 ? data[0].companyName : '';
      const companyCode = data.length > 0 ? data[0].companyCode : '';

      const response = await fetch('/api/financial/indicator-ai-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId,
          indicatorName,
          indicatorDisplayName,
          trendData: data,
          timeRange,
          reportPeriod: dataType === 'financial_indicators' ? '年报' : reportPeriod,
          companyCode,
          companyName
        }),
      });

      if (!response.ok) {
        throw new Error(`AI分析请求失败: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('响应体为空');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      let isFirstContent = true;

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            setAiLoading(false);
            reader.releaseLock();
            
            // 保存完整的AI分析到缓存
            const cacheKey = generateCacheKey('ai');
            saveToCache(cacheKey, { aiAnalysis: aiAnalysisRef.current });
            
            return;
          }

          // 解码数据块
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          // 处理可能包含多行的数据
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // 保留最后一个可能不完整的行

          for (const line of lines) {
            if (line.trim() === '') continue;

            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              
              if (data === '[DONE]') {
                setAiLoading(false);
                reader.releaseLock();
                
                // 保存完整的AI分析到缓存
                const cacheKey = generateCacheKey('ai');
                saveToCache(cacheKey, { aiAnalysis: aiAnalysisRef.current });
                
                return;
              }

              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  updateAiAnalysis(parsed.content);
                }
              } catch (parseError) {
                // 忽略解析错误
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

    } catch (error) {
      setAiAnalysis('AI分析服务暂时不可用，请稍后重试。\n\n错误详情: ' + (error as Error).message);
    } finally {
      setAiLoading(false);
    }
  };

  // 重新生成AI分析
  const regenerateAiAnalysis = () => {
    if (aiRegenerateCount >= 2) {
      alert('已达到最大重新生成次数');
      return;
    }
    
    // 清除AI分析缓存
    const cacheKey = generateCacheKey('ai');
    modalCache.delete(cacheKey);
    
    setAiRegenerateCount(prev => prev + 1);
    setAiAnalysis('');
    aiAnalysisRef.current = '';
    setAiAnalysisStarted(true);
    
    fetchAiAnalysis();
  };

  // 手动开始AI分析
  const startAiAnalysis = () => {
    setAiAnalysisStarted(true);
    
    // 直接执行分析逻辑，不依赖状态更新
    const cacheKey = generateCacheKey('ai');
    const cached = getFromCache(cacheKey);
    
    if (cached?.aiAnalysis) {
      setAiAnalysis(cached.aiAnalysis);
      aiAnalysisRef.current = cached.aiAnalysis;
      return;
    }

    // 缓存中没有数据，检查是否有趋势数据
    if (trendData.length === 0) {
      // 检查趋势数据缓存
      const trendCacheKey = generateCacheKey('trend');
      const trendCached = getFromCache(trendCacheKey);
      
      if (trendCached?.trendData) {
        // 有趋势数据缓存，设置数据后useEffect会自动触发AI分析
        setTrendData(trendCached.trendData);
      } else {
        // 没有趋势数据缓存，需要先获取趋势数据
        // fetchTrendData 完成后会通过 useEffect 自动触发AI分析
        fetchTrendData();
      }
      return;
    }

    // 直接调用AI分析
    fetchAiAnalysis();
  };

  // 清除当前指标的所有缓存（用于调试）
  const clearCurrentCache = () => {
    const trendKey = generateCacheKey('trend');
    const aiKey = generateCacheKey('ai');
    modalCache.delete(trendKey);
    modalCache.delete(aiKey);
    
    // 重新加载数据
    setTrendData([]);
    setAiAnalysis('');
    aiAnalysisRef.current = '';
    loadTrendData();
  };

  if (!isOpen) return null;

  // 准备图表数据
  const chartData = {
    labels: trendData.map(item => {
      const date = new Date(item.date);
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit'
      });
    }),
    datasets: [
      {
        label: indicatorDisplayName,
        data: trendData.map(item => item.value),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: 'rgb(59, 130, 246)',
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#e5e7eb',
          font: {
            size: 12
          }
        }
      },
      title: {
        display: true,
        text: `${indicatorDisplayName} 趋势分析`,
        color: '#ffffff',
        font: {
          size: 16,
          weight: 'bold' as const
        }
      },
      tooltip: {
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        titleColor: '#ffffff',
        bodyColor: '#e5e7eb',
        borderColor: '#8b5cf6',
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            const dataIndex = context.dataIndex;
            const item = trendData[dataIndex];
            return `${context.dataset.label}: ${item.formattedValue}${item.unit}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        title: {
          display: true,
          text: trendData.length > 0 ? `单位: ${trendData[0].unit}` : '',
          color: '#e5e7eb'
        },
        ticks: {
          color: '#9ca3af'
        },
        grid: {
          color: 'rgba(139, 92, 246, 0.1)'
        }
      },
      x: {
        title: {
          display: true,
          text: '时间',
          color: '#e5e7eb'
        },
        ticks: {
          color: '#9ca3af'
        },
        grid: {
          color: 'rgba(139, 92, 246, 0.1)'
        }
      }
    },
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-800/90 to-purple-900/90 backdrop-blur-md rounded-2xl border border-purple-500/30 w-11/12 max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-purple-500/30">
          <h2 className="text-2xl font-bold text-white">
            {indicatorDisplayName} - 详细分析
          </h2>
          <div className="flex items-center space-x-2">
            {/* 开发调试：清除缓存按钮 */}
            {process.env.NODE_ENV === 'development' && (
              <button
                onClick={clearCurrentCache}
                className="px-2 py-1 text-xs rounded bg-red-600/30 text-red-300 hover:bg-red-500/50 hover:text-white transition-colors"
                title="清除当前指标缓存"
              >
                🗑️
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 标签页 */}
        <div className="flex border-b border-purple-500/30 bg-slate-800/50">
          <button
            onClick={() => setActiveTab('trend')}
            className={`px-6 py-4 font-medium text-sm transition-all relative ${
              activeTab === 'trend'
                ? 'text-white bg-gradient-to-r from-purple-600/50 to-green-600/50 border-b-2 border-purple-400'
                : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
              </svg>
              趋势分析
            </div>
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`px-6 py-4 font-medium text-sm transition-all relative ${
              activeTab === 'ai'
                ? 'text-white bg-gradient-to-r from-purple-600/50 to-green-600/50 border-b-2 border-purple-400'
                : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
              </svg>
              AI分析建议
            </div>
          </button>
        </div>

        {/* 内容区域 */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 160px)' }}>
          {activeTab === 'trend' && (
            <div>
              {/* 筛选条件 */}
              <div className="flex gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    时间范围
                  </label>
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
                {dataType === 'financial_data' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      报告期
                    </label>
                    <div className="flex space-x-2">
                      {['Q1', '年中', 'Q3', '年报'].map((period) => (
                        <button
                          key={period}
                          onClick={() => setReportPeriod(period === '年中' ? 'Q2' : period === '年报' ? 'Q4' : period)}
                          className={`px-4 py-2 rounded-lg font-medium transition-all ${
                            (reportPeriod === 'Q2' && period === '年中') || 
                            (reportPeriod === 'Q4' && period === '年报') ||
                            (reportPeriod === period)
                              ? 'bg-gradient-to-r from-purple-600 to-green-600 text-white shadow-lg'
                              : 'bg-slate-700/50 text-gray-300 hover:bg-slate-600/50 hover:text-white'
                          }`}
                        >
                          {period}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 趋势图 */}
              <div className="bg-slate-800/50 rounded-xl p-6 border border-purple-500/20 mb-6">
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                      <div className="text-gray-300">加载趋势数据中...</div>
                    </div>
                  </div>
                ) : trendData.length > 0 ? (
                  <div className="h-96">
                    <Line data={chartData} options={chartOptions} />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                        </svg>
                      </div>
                      <div className="text-gray-400">暂无趋势数据</div>
                    </div>
                  </div>
                )}
              </div>

              {/* 数据表格 */}
              {trendData.length > 0 && (
                <div className="bg-slate-800/50 rounded-xl border border-purple-500/20">
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2z"></path>
                      </svg>
                      数据详情
                    </h3>
                    <div className="overflow-x-auto rounded-lg border border-purple-500/20">
                      <table className="min-w-full divide-y divide-purple-500/20">
                        <thead className="bg-gradient-to-r from-slate-700/50 to-purple-800/50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                              时间
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                              数值
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                              企业
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-gradient-to-b from-slate-800/30 to-purple-900/30 divide-y divide-purple-500/10">
                          {trendData.map((item, index) => (
                            <tr key={index} className={`hover:bg-purple-500/10 transition-all ${
                              index % 2 === 0 ? 'bg-slate-800/20' : 'bg-purple-900/20'
                            }`}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                {new Date(item.date).toLocaleDateString('zh-CN')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-white">
                                {item.formattedValue}{item.unit}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                {item.companyName}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'ai' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center">
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
                <div className="flex space-x-2">
                  {hasAiPermission && !aiAnalysis && !aiLoading && (
                    <button
                      onClick={startAiAnalysis}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium"
                    >
                      开始分析
                    </button>
                  )}
                  {hasAiPermission && aiAnalysis && !aiLoading && aiRegenerateCount < 2 && (
                    <button
                      onClick={regenerateAiAnalysis}
                      className="px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-all font-medium"
                    >
                      重新生成 ({2 - aiRegenerateCount}次)
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-slate-800/50 rounded-xl p-6 border border-purple-500/20 min-h-[400px]">
                {!hasAiPermission ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-500/30">
                      <svg className="w-10 h-10 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-4">AI分析功能限制</h3>
                    <p className="text-gray-300 mb-6 leading-relaxed max-w-md mx-auto">
                      AI智能分析功能仅限付费版用户使用。升级到付费版即可享受基于{indicatorDisplayName}历史数据的专业投资分析建议。
                    </p>
                    <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-lg p-4 border border-amber-500/20 mb-6 max-w-md mx-auto">
                      <div className="flex items-center text-amber-300 text-sm">
                        <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                        </svg>
                        付费版用户可获得深度AI分析报告
                      </div>
                    </div>
                    <button 
                      onClick={() => window.open('/payment', '_blank')}
                      className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg font-medium transition-all transform hover:scale-105 shadow-lg"
                    >
                      升级到付费版
                    </button>
                  </div>
                ) : aiAnalysis ? (
                  <div className="prose prose-invert max-w-none">
                    <div className="markdown-content text-gray-300 leading-relaxed">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({children}) => <h1 className="text-2xl font-bold text-white mb-4 border-b border-purple-500/30 pb-2">{children}</h1>,
                          h2: ({children}) => <h2 className="text-xl font-bold text-white mb-3 mt-6 flex items-center">{children}</h2>,
                          h3: ({children}) => <h3 className="text-lg font-semibold text-gray-200 mb-2 mt-4">{children}</h3>,
                          p: ({children}) => <p className="text-gray-300 mb-3 leading-relaxed">{children}</p>,
                          ul: ({children}) => <ul className="list-disc list-inside text-gray-300 mb-3 space-y-1">{children}</ul>,
                          ol: ({children}) => <ol className="list-decimal list-inside text-gray-300 mb-3 space-y-1">{children}</ol>,
                          li: ({children}) => <li className="text-gray-300">{children}</li>,
                          strong: ({children}) => <strong className="text-white font-semibold">{children}</strong>,
                          em: ({children}) => <em className="text-purple-300 italic">{children}</em>,
                          code: ({children}) => <code className="bg-slate-700/50 text-purple-300 px-1 py-0.5 rounded text-sm">{children}</code>,
                          blockquote: ({children}) => <blockquote className="border-l-4 border-purple-500 pl-4 italic text-gray-400 my-4">{children}</blockquote>,
                          table: ({children}) => (
                            <div className="overflow-x-auto my-4">
                              <table className="min-w-full border border-gray-600 rounded-lg overflow-hidden">
                                {children}
                              </table>
                            </div>
                          ),
                          thead: ({children}) => <thead className="bg-gray-700">{children}</thead>,
                          tbody: ({children}) => <tbody className="bg-gray-800/50">{children}</tbody>,
                          tr: ({children}) => <tr className="border-b border-gray-600 hover:bg-gray-700/30 transition-colors">{children}</tr>,
                          th: ({children}) => <th className="px-4 py-3 text-left text-sm font-semibold text-gray-200 border-r border-gray-600 last:border-r-0">{children}</th>,
                          td: ({children}) => <td className="px-4 py-3 text-sm text-gray-300 border-r border-gray-600 last:border-r-0">{children}</td>,
                        }}
                      >
                        {aiAnalysis}
                      </ReactMarkdown>
                    </div>
                  </div>
                ) : aiLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                      <p className="text-gray-300">AI正在分析中，请稍候...</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                      </svg>
                    </div>
                    <p className="text-gray-400 mb-4">点击"开始分析"按钮开始分析</p>
                    <p className="text-xs text-gray-500">基于{indicatorDisplayName}的历史数据，AI将为您提供专业的投资分析建议</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IndicatorDetailModal; 