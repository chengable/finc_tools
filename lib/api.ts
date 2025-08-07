import axios from 'axios';

// 类型定义
export interface TaskDetails {
  taskName: string;
  taskType: 'enterprise' | 'industry';
  companies: Array<{
    code: string;
    name: string;
  }>;
  industryName?: string;
  status: string;
  createdAt: string;
}

export interface FinancialData {
  date: string;
  items: {
    name: string;
    displayName: string;
    value: number | null;
    formattedValue: string;
    unit: string;
    yoy?: number | null;
  }[];
}

export interface FinancialIndicator {
  date: string;
  reportType: string;
  items: {
    name: string;
    displayName: string;
    value: number | null;
    formattedValue: string;
    unit: string;
    yoy?: number | null;
  }[];
}

export interface AIAnalysis {
  financialDataAnalysis: string;
  financialIndicatorAnalysis: string;
}

// API函数
export const getTaskDetails = async (taskId: string): Promise<TaskDetails> => {
  const response = await axios.get(`/api/tasks/${taskId}`);
  return response.data;
};

export const getFinancialData = async (params: {
  taskId: string;
  type: string;
  timeRange: string;
  reportPeriods: string[];
}): Promise<FinancialData[]> => {
  // 构建URL参数，确保数组参数正确传递
  const searchParams = new URLSearchParams();
  searchParams.append('taskId', params.taskId);
  searchParams.append('type', params.type);
  searchParams.append('timeRange', params.timeRange);
  
  // 为每个报告期添加参数
  params.reportPeriods.forEach(period => {
    searchParams.append('reportPeriods', period);
  });
  
  const response = await axios.get(`/api/financial/data?${searchParams.toString()}`);
  return response.data;
};

export const getFinancialIndicators = async (params: {
  taskId: string;
  type: string;
  timeRange: string;
  reportPeriods: string[];
}): Promise<FinancialIndicator[]> => {
  // 构建URL参数，确保数组参数正确传递
  const searchParams = new URLSearchParams();
  searchParams.append('taskId', params.taskId);
  searchParams.append('type', params.type);
  searchParams.append('timeRange', params.timeRange);
  
  // 为每个报告期添加参数
  params.reportPeriods.forEach(period => {
    searchParams.append('reportPeriods', period);
  });
  
  const response = await axios.get(`/api/financial/indicators?${searchParams.toString()}`);
  return response.data;
};

export const getAIAnalysis = async (taskId: string): Promise<AIAnalysis> => {
  const response = await axios.get(`/api/financial/ai-analysis/${taskId}`);
  return response.data;
}; 