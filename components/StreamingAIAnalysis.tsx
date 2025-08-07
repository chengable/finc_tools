import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface StreamingAIAnalysisProps {
  taskId: string;
  analysisType: 'financial_data' | 'financial_indicators';
  title: string;
  userType?: 'free' | 'premium' | 'admin';
  username?: string;
}

export default function StreamingAIAnalysis({ taskId, analysisType, title, userType, username }: StreamingAIAnalysisProps) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [currentAnalysisType, setCurrentAnalysisType] = useState(analysisType);
  
  // 检查用户权限
  const hasAiPermission = userType === 'premium' || userType === 'admin' || username === 'developer';

  // 当analysisType变化时重置组件状态
  useEffect(() => {
    if (currentAnalysisType !== analysisType) {
      setContent('');
      setError(null);
      setHasStarted(false);
      setLoading(false);
      setCurrentAnalysisType(analysisType);
    }
  }, [analysisType, currentAnalysisType]);

  const startAnalysis = async (forceRefresh = false) => {
    if (loading) return;
    
    setLoading(true);
    setError(null);
    setContent('');
    setHasStarted(true);

    try {
      const response = await fetch('/api/financial/ai-analysis-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId,
          analysisType,
          forceRefresh
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '请求失败');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法读取响应流');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        // 实时更新内容
        setContent(buffer);
      }

    } catch (err) {
      console.error('AI分析失败:', err);
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  const resetAnalysis = () => {
    setContent('');
    setError(null);
    setHasStarted(false);
    setLoading(false);
  };

  const handleStartAnalysis = () => {
    startAnalysis(false);
  };

  const handleForceRefresh = () => {
    startAnalysis(true);
  };

  return (
    <div className="space-y-4">
      {/* 标题和控制按钮 */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <div className="flex space-x-2">
          {hasAiPermission && !hasStarted && (
            <button
              onClick={handleStartAnalysis}
              disabled={loading}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-green-600 text-white rounded-lg hover:from-purple-700 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '分析中...' : '开始AI分析'}
            </button>
          )}
          {hasAiPermission && hasStarted && error && (
            <button
              onClick={handleForceRefresh}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              重新分析
            </button>
          )}
        </div>
      </div>

      {/* 分析状态 */}
      {loading && (
        <div className="flex items-center space-x-2 text-purple-400">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-400"></div>
          <span>AI正在分析中，请稍候...</span>
        </div>
      )}

      {/* 错误信息 */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
            <span className="text-red-300 font-medium">分析失败</span>
          </div>
          <p className="text-red-200 mt-2">{error}</p>
        </div>
      )}

      {/* AI分析内容 */}
      <div className="border border-gray-600/50 rounded-lg p-6 bg-gray-800/30 min-h-[400px]">
        {!hasAiPermission ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-500/30">
              <svg className="w-10 h-10 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-4">AI分析功能限制</h3>
            <p className="text-gray-300 mb-6 leading-relaxed max-w-md mx-auto">
              AI智能分析功能仅限付费版用户使用。升级到付费版即可享受基于企业财务数据的专业投资分析建议。
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
        ) : (content || hasStarted) ? (
          content ? (
            <div className="prose max-w-none prose-sm prose-invert">
                            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // 自定义组件样式以确保换行和深色主题适配
                  p: ({node, ...props}) => <p className="mb-3 text-base leading-relaxed text-gray-200" {...props} />,
                  h1: ({node, ...props}) => <h1 className="text-xl font-bold mb-3 text-white" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-lg font-semibold mb-2 text-gray-100" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-base font-medium mb-2 text-gray-200" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc list-inside mb-3 space-y-2 text-gray-200" {...props} />,
                  ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-3 space-y-2 text-gray-200" {...props} />,
                  li: ({node, ...props}) => <li className="text-base leading-relaxed text-gray-200" {...props} />,
                  strong: ({node, ...props}) => <strong className="font-semibold text-white" {...props} />,
                  em: ({node, ...props}) => <em className="italic text-gray-300" {...props} />,
                  blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-purple-500 pl-4 italic text-gray-300 text-base" {...props} />,
                  code: ({node, ...props}) => <code className="bg-gray-700 text-green-400 px-1 py-0.5 rounded text-sm" {...props} />,
                  // 表格样式
                  table: ({node, ...props}) => (
                    <div className="overflow-x-auto mb-4">
                      <table className="min-w-full border-collapse border border-gray-600 bg-gray-800/50 rounded-lg" {...props} />
                    </div>
                  ),
                  thead: ({node, ...props}) => <thead className="bg-gray-700/50" {...props} />,
                  tbody: ({node, ...props}) => <tbody {...props} />,
                  tr: ({node, ...props}) => <tr className="border-b border-gray-600 hover:bg-gray-700/30 transition-colors" {...props} />,
                  th: ({node, ...props}) => (
                    <th className="border border-gray-600 px-4 py-3 text-left font-semibold text-gray-100 bg-gray-700/70" {...props} />
                  ),
                  td: ({node, ...props}) => (
                    <td className="border border-gray-600 px-4 py-3 text-gray-200" {...props} />
                  ),
                }}
              >
                {content}
              </ReactMarkdown>
              {loading && (
                <div className="flex items-center space-x-2 mt-4 text-purple-400">
                  <div className="animate-pulse w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span className="text-sm">正在生成...</span>
                </div>
              )}
            </div>
          ) : hasStarted && !error ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto mb-2"></div>
                <p className="text-gray-400">等待AI分析结果...</p>
              </div>
            </div>
          ) : null
        ) : (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                </svg>
              </div>
              <p className="text-gray-400 mb-4">点击"开始AI分析"按钮获取专业的财务分析建议</p>
              <p className="text-xs text-gray-500">AI将基于最新财务数据和历史趋势，为您提供深度分析和投资建议</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 