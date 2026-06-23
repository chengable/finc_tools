import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import jwt from 'jsonwebtoken';
import { getFieldUnit, formatValue as configFormatValue, formatIndicatorValue, FINANCIAL_INDICATORS_NAMES, FINANCIAL_DATA_NAMES } from '../../../lib/financial-config';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '方法不允许' });
  }

  try {
    // 验证用户登录状态
    const token = req.cookies.jwt_token;
    if (!token) {
      return res.status(401).json({ message: '请先登录' });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || '');
    } catch (error) {
      return res.status(401).json({ message: '登录状态已过期' });
    }

    // 获取用户信息
    let user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    // 如果找不到普通用户，且userid看起来是数字(可能是AdminUser的ID)，尝试查找管理员
    if (!user && /^\d+$/.test(decoded.userId)) {
      user = await prisma.user.findFirst({
        where: {
          userType: 'admin'
        }
      });
    }

    if (!user || !user.canLogin) {
      return res.status(401).json({ 
        success: false,
        message: '用户不存在或被禁用' 
      });
    }

    // 趋势分析功能对所有用户开放

    const { taskId, indicatorName, dataType, timeRange, reportPeriod } = req.body;

    if (!taskId || !indicatorName || !dataType || !timeRange || !reportPeriod) {
      return res.status(400).json({ 
        success: false,
        message: '参数不完整' 
      });
    }

    // 获取任务信息
    const task = await prisma.task.findUnique({
      where: { taskId8Digit: taskId }
    });

    if (!task) {
      return res.status(404).json({ 
        success: false,
        message: '任务不存在' 
      });
    }

    // 检查权限：只有任务创建者或管理员可以查看
    if (task.userId !== user.id && user.userType !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: '无权限查看此任务' 
      });
    }

    // 解析企业列表
    const companies = JSON.parse(task.companies);
    
    // 计算时间范围
    const now = new Date();
    const years = parseInt(timeRange.replace('年', ''));
    const startDate = new Date(now.getFullYear() - years, 0, 1);

    // 将中文指标名称转换为英文字段名
    const englishFieldName = getEnglishFieldName(indicatorName, dataType);

    // 将前端报告期转换为数据库格式
    const dbReportPeriod = convertReportPeriod(reportPeriod);

    let trendData: any[] = [];

    if (dataType === 'financial_data') {
      // 财务数据趋势
      for (const company of companies) {
        const data = await prisma.companyFinancialData.findMany({
          where: {
            companyId: company.code,
            reportType: dbReportPeriod,
            reportDate: {
              gte: startDate
            }
          },
          orderBy: {
            reportDate: 'asc'
          }
        });

        for (const item of data) {
          try {
            const financialData = JSON.parse(item.financialData);
            if (financialData[englishFieldName] !== undefined && financialData[englishFieldName] !== null) {
              // 处理数组格式的数据（如 [value, ratio]）
              let rawValue = financialData[englishFieldName];
              if (Array.isArray(rawValue)) {
                rawValue = rawValue[0]; // 取数组的第一个元素作为实际值
              }
              
              const value = parseFloat(rawValue);
              if (!isNaN(value)) {
                trendData.push({
                  date: item.reportDate.toISOString(),
                  value: value,
                  formattedValue: configFormatValue(value, englishFieldName),
                  unit: getUnitFromConfig(englishFieldName, dataType),
                  companyName: company.name,
                  companyCode: company.code
                });
              }
            }
          } catch (error) {
            console.error('解析财务数据失败:', error);
          }
        }
      }
    } else {
      // 财务指标趋势
      for (const company of companies) {
        const data = await prisma.companyFinancialIndicators.findMany({
          where: {
            companyId: company.code,
            reportType: dbReportPeriod,
            reportDate: {
              gte: startDate
            }
          },
          orderBy: {
            reportDate: 'asc'
          }
        });

        // 如果没有数据，尝试使用Q4报告期
        if (data.length === 0 && dbReportPeriod !== 'Q4') {
          const q4Data = await prisma.companyFinancialIndicators.findMany({
            where: {
              companyId: company.code,
              reportType: 'Q4',
              reportDate: {
                gte: startDate
              }
            },
            orderBy: {
              reportDate: 'asc'
            }
          });
          
          if (q4Data.length > 0) {
            data.push(...q4Data);
          }
        }

        for (const item of data) {
          try {
            // 从各个指标类别中查找指标值
            const allIndicators = {
              ...parseJsonField(item.profitabilityIndicators),
              ...parseJsonField(item.cashFlowIndicators),
              ...parseJsonField(item.solvencyIndicators),
              ...parseJsonField(item.operatingEfficiencyIndicators),
              ...parseJsonField(item.growthIndicators),
              ...parseJsonField(item.dupontIndicators),
              ...parseJsonField(item.qualityIndicators),
              ...parseJsonField(item.valuationIndicators),
              ...parseJsonField(item.riskIndicators)
            };
            
            const value = findIndicatorValue(allIndicators, englishFieldName);
            
            if (value !== null && !isNaN(value)) {
              trendData.push({
                date: item.reportDate.toISOString(),
                value: value,
                formattedValue: formatIndicatorValue(value, englishFieldName),
                unit: getUnitFromConfig(englishFieldName, dataType),
                companyName: company.name,
                companyCode: company.code
              });
            }
          } catch (error) {
            // 不需要打印解析错误，因为已经处理了
          }
        }
      }
    }

    // 按日期排序并去重（如果是行业分析，可能需要计算平均值）
    if (task.taskType === 'industry' && companies.length > 1) {
      // 行业分析：按日期分组并计算平均值
      const groupedData: { [key: string]: any[] } = {};
      
      trendData.forEach(item => {
        const dateKey = item.date.split('T')[0];
        if (!groupedData[dateKey]) {
          groupedData[dateKey] = [];
        }
        groupedData[dateKey].push(item);
      });

      trendData = Object.keys(groupedData).map(dateKey => {
        const items = groupedData[dateKey];
        const avgValue = items.reduce((sum, item) => sum + item.value, 0) / items.length;
        
        return {
          date: items[0].date,
          value: avgValue,
          formattedValue: dataType === 'financial_data' 
            ? configFormatValue(avgValue, englishFieldName)
            : formatIndicatorValue(avgValue, englishFieldName),
          unit: items[0].unit,
          companyName: '行业平均'
        };
      }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } else {
      // 企业分析：直接排序
      trendData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }

    res.status(200).json({
      success: true,
      data: trendData
    });

  } catch (error) {
    console.error('获取指标趋势数据失败:', error);
    res.status(500).json({
      success: false,
      message: '获取指标趋势数据失败'
    });
  }
}

// 解析JSON字段
function parseJsonField(jsonString: string | null): Record<string, any> {
  if (!jsonString) return {};
  try {
    const parsed = JSON.parse(jsonString);
    return parsed;
  } catch (error) {
    console.error('解析JSON字段失败:', error);
    return {};
  }
}

// 在指标对象中查找指标值
function findIndicatorValue(indicators: Record<string, any>, indicatorName: string): number | null {
  if (indicators[indicatorName] !== undefined && indicators[indicatorName] !== null) {
    const rawValue = indicators[indicatorName];
    
    // 处理可能的数组格式
    let valueToConvert = rawValue;
    if (Array.isArray(rawValue)) {
      valueToConvert = rawValue[0];
    }
    
    const value = parseFloat(valueToConvert);
    if (isNaN(value)) {
      return null;
    }
    
    return value;
  }
  
  // 特殊处理营业收入增长率
  if (indicatorName === 'revenueGrowthRate' && indicators['revenue_growth_rate'] !== undefined) {
    return findIndicatorValue(indicators, 'revenue_growth_rate');
  }
  
  return null;
}

// 获取单位 - 从财务配置中获取正确的单位
function getUnitFromConfig(indicatorName: string, dataType: string): string {
  try {
    // 尝试从配置中获取单位
    const unit = getFieldUnit(indicatorName);
    if (unit) {
      return unit;
    }
  } catch (error) {
    console.error('获取单位配置失败:', error);
  }
  
  // 如果配置中没有，使用默认逻辑
  if (dataType === 'financial_data') {
    // 财务数据单位通常是万元或亿元
    return '万元';
  } else {
    // 财务指标单位根据指标类型确定
    if (indicatorName.includes('率') || indicatorName.includes('比')) {
      return '%';
    } else if (indicatorName.includes('每股')) {
      return '元/股';
    } else if (indicatorName.includes('倍')) {
      return '倍';
    } else if (indicatorName.includes('天')) {
      return '天';
    } else {
      return '';
    }
  }
}

// 将中文指标名称转换为英文字段名
function getEnglishFieldName(chineseName: string, dataType: string): string {
  // 直接处理常见的指标名称
  if (chineseName === '营业收入增长率') {
    return 'revenueGrowthRate';
  }
  
  if (chineseName === '净利润增长率') {
    return 'netProfitGrowthRate';
  }
  
  if (dataType === 'financial_data') {
    // 财务数据：查找中文名称对应的英文字段名
    for (const [englishName, chineseDisplayName] of Object.entries(FINANCIAL_DATA_NAMES)) {
      if (chineseDisplayName === chineseName) {
        return englishName;
      }
    }
  } else {
    // 财务指标：查找中文名称对应的英文字段名
    for (const [englishName, chineseDisplayName] of Object.entries(FINANCIAL_INDICATORS_NAMES)) {
      if (chineseDisplayName === chineseName) {
        return englishName;
      }
    }
  }
  
  // 如果没找到映射，返回原名称
  return chineseName;
}

// 将前端报告期转换为数据库格式
function convertReportPeriod(reportPeriod: string): string {
  const reportPeriodMap: Record<string, string> = {
    '年报': 'Q4',
    'Q1': 'Q1',
    '年中': 'Q2',
    'Q3': 'Q3'
  };
  
  const result = reportPeriodMap[reportPeriod] || 'Q4';
  return result;
} 