import React from 'react';
import { FinancialData, FinancialIndicator } from '../lib/api';

interface FinancialDataTableProps {
  data: (FinancialData | FinancialIndicator)[];
  showSync: boolean;
  onIndicatorClick?: (indicatorName: string, indicatorDisplayName: string, dataType: 'financial_data' | 'financial_indicators') => void;
  userType?: 'free' | 'premium' | 'admin';
  username?: string;
  dataType?: 'financial_data' | 'financial_indicators';
}

export default function FinancialDataTable({ data, showSync, onIndicatorClick, userType, username, dataType: propDataType }: FinancialDataTableProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-lg">暂无数据</div>
        <div className="text-gray-500 text-sm mt-2">请选择其他筛选条件</div>
      </div>
    );
  }

  // 获取所有唯一的指标名称
  const allItems = new Set<string>();
  data.forEach((item) => {
    item.items.forEach((i) => allItems.add(i.name));
  });

  // 获取指标的显示信息
  const getItemDisplayInfo = (itemName: string) => {
    for (const item of data) {
      const found = item.items.find(i => i.name === itemName);
      if (found) {
        return {
          displayName: found.displayName,
          unit: found.unit
        };
      }
    }
    return { displayName: itemName, unit: '' };
  };

  // 判断是否为总结性指标（通常包含"总"、"合计"、"净"等关键词）
  const isSummaryIndicator = (itemName: string, displayName: string) => {
    const summaryKeywords = ['总', '合计', '净', '小计', '汇总', '总计', '总额', '总和'];
    return summaryKeywords.some(keyword => 
      itemName.includes(keyword) || displayName.includes(keyword)
    );
  };

  // 检查数据项是否有reportType字段
  const hasReportType = (item: FinancialData | FinancialIndicator): item is FinancialIndicator => {
    return 'reportType' in item;
  };

  // 检查用户权限
  const hasPermission = userType === 'premium' || userType === 'admin' || username === 'developer';

  // 判断数据类型 - 优先使用传递进来的dataType，否则根据数据结构判断
  const dataType: 'financial_data' | 'financial_indicators' = propDataType || (data.length > 0 && hasReportType(data[0]) ? 'financial_indicators' : 'financial_data');

  // 处理指标点击事件 - 所有用户都可以点击查看趋势
  const handleIndicatorClick = (itemName: string, displayName: string) => {
    if (onIndicatorClick) {
      onIndicatorClick(itemName, displayName, dataType);
    }
  };

  return (
    <div className="w-full">
      {/* 操作提示 */}
      <div className="mb-4 p-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
        <div className="flex items-center text-sm text-blue-300">
          <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span>💡 点击第一列的指标名称可查看该指标的趋势图表分析</span>
        </div>
      </div>
      
      {/* 表格容器 - 固定最大宽度并支持横向滚动 */}
      <div className="max-w-[calc(100vw-24rem)] overflow-x-auto rounded-xl border border-purple-500/20">
        <table className="w-full min-w-[800px] divide-y divide-purple-500/20">
          <thead className="bg-gradient-to-r from-slate-700/50 to-purple-800/50">
            <tr>
              <th className="px-4 py-4 text-left text-sm font-bold text-white uppercase tracking-wider sticky left-0 bg-gradient-to-r from-slate-700/90 to-purple-800/90 backdrop-blur-sm border-r border-purple-500/20 w-64">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                  </svg>
                  指标名称
                </div>
              </th>
              {data.map((item, index) => (
                <th
                  key={item.date}
                  className="px-6 py-4 text-center text-sm font-bold text-white uppercase tracking-wider min-w-[180px] border-r border-purple-500/20 last:border-r-0"
                >
                  <div className="flex flex-col items-center">
                    <div className="text-purple-300 text-xs mb-1">
                      {hasReportType(item) ? item.reportType : '报告期'}
                    </div>
                    <div className="font-mono">
                      {new Date(item.date).toLocaleDateString('zh-CN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                      })}
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-gradient-to-b from-slate-800/30 to-purple-900/30 divide-y divide-purple-500/10">
            {Array.from(allItems).map((itemName, index) => {
              const displayInfo = getItemDisplayInfo(itemName);
              const isSummary = isSummaryIndicator(itemName, displayInfo.displayName);
              
              return (
                <tr 
                  key={itemName} 
                  className={`hover:bg-purple-500/10 transition-all duration-200 ${
                    index % 2 === 0 ? 'bg-slate-800/20' : 'bg-purple-900/20'
                  }`}
                >
                  <td className={`px-4 py-4 text-sm sticky left-0 backdrop-blur-sm border-r border-purple-500/20 w-64 ${
                    isSummary 
                      ? 'bg-gradient-to-r from-slate-700/90 to-purple-800/90 font-bold text-white' 
                      : 'bg-gradient-to-r from-slate-800/90 to-purple-900/90 font-medium text-gray-300'
                  }`}>
                    <div className={`flex items-center ${isSummary ? '' : 'pl-4'}`}>
                      {isSummary && (
                        <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-green-400 rounded-full mr-3 flex-shrink-0"></div>
                      )}
                      <div className="flex flex-col min-w-0 flex-1">
                        <div 
                          className={`${isSummary ? 'text-base font-bold' : 'text-sm font-medium'} truncate cursor-pointer hover:text-purple-300 transition-colors`}
                          onClick={() => handleIndicatorClick(itemName, displayInfo.displayName)}
                          title="点击查看趋势分析"
                        >
                          {displayInfo.displayName}
                          <svg className="w-3 h-3 inline-block ml-1 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </td>
                  {data.map((item) => {
                    const value = item.items.find((i) => i.name === itemName);
                    return (
                      <td 
                        key={item.date} 
                        className="px-6 py-4 text-center text-sm border-r border-purple-500/20 last:border-r-0"
                      >
                        <div className="flex items-center justify-center space-x-3">
                          <div className="flex items-center space-x-1">
                            <span className={`font-mono ${
                              isSummary ? 'text-white font-bold text-base' : 'text-gray-300 font-medium'
                            }`}>
                              {value?.formattedValue || '--'}
                            </span>
                            {value?.formattedValue && value?.unit && (
                              <span className={`text-xs ${
                                isSummary ? 'text-white/80' : 'text-gray-300/80'
                              }`}>
                                {value.unit}
                              </span>
                            )}
                          </div>
                          {showSync && value?.yoy !== undefined && value?.yoy !== null && typeof value.yoy === 'number' && !isNaN(value.yoy) && (
                            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                              value.yoy > 0 
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                                : value.yoy < 0
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                            }`}>
                              <svg className={`w-3 h-3 mr-1 ${
                                value.yoy > 0 ? 'rotate-0' : 'rotate-180'
                              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11l5-5m0 0l5 5m-5-5v12"></path>
                              </svg>
                              {value.yoy > 0 ? '+' : ''}
                              {value.yoy.toFixed(2)}%
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* 表格说明 */}
      <div className="mt-4 flex items-center justify-between text-sm text-gray-400">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-green-400 rounded-full mr-2"></div>
            <span>重要指标</span>
          </div>
          {showSync && (
            <div className="flex items-center space-x-3">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500/20 border border-red-500/30 rounded mr-2"></div>
                <span>同比上升</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500/20 border border-green-500/30 rounded mr-2"></div>
                <span>同比下降</span>
              </div>
            </div>
          )}
        </div>
        <div className="text-xs">
          共 {Array.from(allItems).length} 项指标 · {data.length} 个报告期
        </div>
      </div>
    </div>
  );
} 