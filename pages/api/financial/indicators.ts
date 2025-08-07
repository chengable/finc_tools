import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';
import { EXCLUDED_FIELDS, getFieldDisplayName, formatIndicatorValue, getFieldUnit } from '../../../lib/financial-config';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: '方法不允许' });
  }

  try {
    const token = req.cookies.jwt_token;
    if (!token) {
      return res.status(401).json({ message: '未登录' });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ message: '无效的token' });
    }

    const { taskId, type, timeRange, reportPeriods } = req.query;

    // 验证任务权限
    // @ts-ignore  
    const task = await prisma.task.findUnique({
      where: { taskId8Digit: taskId as string },
    });

    if (!task) {
      return res.status(404).json({ message: '任务不存在' });
    }

    if (decoded.userType !== 'admin' && task.userId !== decoded.userId) {
      return res.status(403).json({ message: '无权访问此任务' });
    }

    // 获取任务中的公司信息
    let companies = [];
    try {
      companies = JSON.parse(task.companies);
    } catch (error) {
      console.error('解析公司信息失败:', error);
      return res.status(500).json({ message: '任务数据异常' });
    }

    if (companies.length === 0) {
      return res.status(404).json({ message: '任务中没有公司数据' });
    }

    // 根据任务类型决定数据处理方式
    if (task.taskType === 'industry') {
      // 行业分析：返回所有公司的平均值数据
      return await handleIndustryIndicatorsData(companies, type as string, timeRange as string, reportPeriods, res);
    } else {
      // 企业分析：返回第一个公司的数据
      const companyCode = companies[0].code;
      return await handleEnterpriseIndicatorsData(companyCode, type as string, timeRange as string, reportPeriods, res);
    }
  } catch (error) {
    console.error('获取财务指标失败:', error);
    return res.status(500).json({ message: '服务器错误' });
  }
}

// 处理企业分析指标数据
async function handleEnterpriseIndicatorsData(
  companyCode: string, 
  type: string, 
  timeRange: string, 
  reportPeriods: any, 
  res: NextApiResponse
) {
    // 计算时间范围
    const now = new Date();
  const years = parseInt(timeRange.replace(/[^0-9]/g, ''));
  
  if (isNaN(years) || years <= 0) {
    return res.status(400).json({ message: '无效的时间范围' });
  }
  
    const startDate = new Date(now.getFullYear() - years, now.getMonth(), now.getDate());

  // 处理 reportPeriods 参数 - 支持最新一期和年报指标
  let reportPeriodsArray: string[] = [];
  if (Array.isArray(reportPeriods)) {
    reportPeriodsArray = reportPeriods as string[];
  } else if (typeof reportPeriods === 'string') {
    reportPeriodsArray = [reportPeriods];
  } else {
    return res.status(400).json({ message: '报告期参数错误' });
  }

  // 处理特殊的报告期参数
  let whereConditions: any = {
    companyId: companyCode,
    reportDate: {
      gte: startDate,
    },
  };

  // 如果包含 lastdate，获取最新一期数据
  if (reportPeriodsArray.includes('lastdate')) {
    // 先获取最新的报告期数据
    // @ts-ignore
    const latestIndicator = await prisma.companyFinancialIndicators.findFirst({
      where: {
        companyId: companyCode,
      },
      orderBy: {
        reportDate: 'desc',
      },
    });

    if (latestIndicator) {
      // 如果只选择了最新一期，只返回最新一期数据
      if (reportPeriodsArray.length === 1 && reportPeriodsArray[0] === 'lastdate') {
        whereConditions = {
          companyId: companyCode,
          reportDate: latestIndicator.reportDate,
          reportType: latestIndicator.reportType,
        };
      } else {
        // 如果同时选择了最新一期和年报，需要包含两种条件
        const otherPeriods = reportPeriodsArray.filter(p => p !== 'lastdate');
        whereConditions = {
          companyId: companyCode,
          reportDate: {
            gte: startDate,
          },
          OR: [
            {
              reportDate: latestIndicator.reportDate,
              reportType: latestIndicator.reportType,
            },
            {
              reportType: {
                in: otherPeriods,
              },
            },
          ],
        };
      }
    }
  } else {
    // 常规的报告期筛选
    const validPeriods = ['Q1', 'Q2', 'Q3', 'Q4'];
    const mappedReportPeriods = reportPeriodsArray.filter(period => validPeriods.includes(period));

    if (mappedReportPeriods.length === 0) {
      return res.status(400).json({ message: '无效的报告期' });
    }

    whereConditions.reportType = {
      in: mappedReportPeriods,
    };
  }

  // 获取财务指标数据
  // @ts-ignore
  const financialIndicators = await prisma.companyFinancialIndicators.findMany({
    where: whereConditions,
    orderBy: {
      reportDate: 'desc',
    },
  });

  // 检查财务指标数据是否存在
  if (!financialIndicators || financialIndicators.length === 0) {
    return res.status(200).json([]);
  }

  // 处理数据并计算同比
  const processedData = await Promise.all(financialIndicators.map(async (indicator: any) => {
    // 根据指标类型获取对应的数据
    let indicatorData = getIndicatorDataByType(indicator, type);

    // 查找上一年同期数据用于计算同比
    let previousYearData = financialIndicators.find(
      (d: any) =>
        d.reportDate.getFullYear() === indicator.reportDate.getFullYear() - 1 &&
        d.reportType === indicator.reportType
    );

    // 如果在当前数据集中没有找到上一年数据，从数据库中查询
    if (!previousYearData) {
      const previousYear = indicator.reportDate.getFullYear() - 1;
      const previousYearDate = new Date(previousYear, indicator.reportDate.getMonth(), indicator.reportDate.getDate());
      
      // @ts-ignore
      previousYearData = await prisma.companyFinancialIndicators.findFirst({
        where: {
          companyId: companyCode,
          reportDate: previousYearDate,
          reportType: indicator.reportType,
        },
      });
    }

    let previousYearIndicatorData: any = {};
    if (previousYearData) {
      previousYearIndicatorData = getIndicatorDataByType(previousYearData, type);
    }

    // 转换数据格式
    const items = Object.keys(indicatorData)
      .map((key) => {
        const rawValue = indicatorData[key];
        
        // 处理字符串类型的数值，确保currentValue是数字类型
        let currentValue = null;
        if (rawValue !== null && rawValue !== undefined) {
          if (typeof rawValue === 'number') {
            currentValue = rawValue;
          } else if (typeof rawValue === 'string' && rawValue.trim() !== '') {
            const parsed = parseFloat(rawValue);
            if (!isNaN(parsed)) {
              currentValue = parsed;
            }
          }
        }
        
        let yoy = undefined;

        if (previousYearIndicatorData[key] !== undefined && previousYearIndicatorData[key] !== null && previousYearIndicatorData[key] !== 0) {
          let previousValue = previousYearIndicatorData[key];
          
          // 同样处理上年数据的类型转换
          if (typeof previousValue === 'string' && previousValue.trim() !== '') {
            const parsed = parseFloat(previousValue);
            if (!isNaN(parsed)) {
              previousValue = parsed;
            }
          }
          
          if (currentValue !== null && currentValue !== undefined && typeof previousValue === 'number') {
            yoy = ((currentValue - previousValue) / previousValue) * 100;
          }
        }

        const formattedValue = formatIndicatorValue(currentValue, key);

        return {
          name: key,
          displayName: getFieldDisplayName(key, true),
          value: currentValue,
          formattedValue: formattedValue,
          unit: getFieldUnit(key),
          yoy: yoy
        };
      });

    return {
      date: indicator.reportDate,
      items: items
    };
  }));

  return res.status(200).json(processedData);
}

// 处理行业分析指标数据（返回平均值）
async function handleIndustryIndicatorsData(
  companies: any[], 
  type: string, 
  timeRange: string, 
  reportPeriods: any, 
  res: NextApiResponse
) {
  // 计算时间范围
  const now = new Date();
  const years = parseInt(timeRange.replace(/[^0-9]/g, ''));
  
  if (isNaN(years) || years <= 0) {
    return res.status(400).json({ message: '无效的时间范围' });
  }
  
  const startDate = new Date(now.getFullYear() - years, now.getMonth(), now.getDate());

  // 处理 reportPeriods 参数
  let reportPeriodsArray: string[] = [];
  if (Array.isArray(reportPeriods)) {
    reportPeriodsArray = reportPeriods as string[];
  } else if (typeof reportPeriods === 'string') {
    reportPeriodsArray = [reportPeriods];
  } else {
    return res.status(400).json({ message: '报告期参数错误' });
  }

  // 获取所有公司的代码
  const companyCodes = companies.map(c => c.code);

  // 处理特殊的报告期参数
  let whereConditions: any = {
    companyId: {
      in: companyCodes,
    },
    reportDate: {
      gte: startDate,
    },
  };

  // 如果包含 lastdate，获取最新一期数据
  if (reportPeriodsArray.includes('lastdate')) {
    // 获取每个公司的最新报告期数据
    const latestIndicators = await Promise.all(
      companyCodes.map(async (companyCode) => {
        // @ts-ignore
        return await prisma.companyFinancialIndicators.findFirst({
          where: {
            companyId: companyCode,
          },
          orderBy: {
            reportDate: 'desc',
          },
        });
      })
    );

    const validLatestIndicators = latestIndicators.filter(indicator => indicator !== null);

    if (validLatestIndicators.length > 0) {
      // 如果只选择了最新一期，只返回最新一期数据
      if (reportPeriodsArray.length === 1 && reportPeriodsArray[0] === 'lastdate') {
        // 获取所有公司的最新数据
        const latestDates = validLatestIndicators.map(indicator => ({
          companyId: indicator!.companyId,
          reportDate: indicator!.reportDate,
          reportType: indicator!.reportType,
        }));

        whereConditions = {
          OR: latestDates.map(item => ({
            companyId: item.companyId,
            reportDate: item.reportDate,
            reportType: item.reportType,
          })),
        };
      } else {
        // 如果同时选择了最新一期和年报，需要包含两种条件
        const otherPeriods = reportPeriodsArray.filter(p => p !== 'lastdate');
        const latestDates = validLatestIndicators.map(indicator => ({
          companyId: indicator!.companyId,
          reportDate: indicator!.reportDate,
          reportType: indicator!.reportType,
        }));

        whereConditions = {
          OR: [
            ...latestDates.map(item => ({
              companyId: item.companyId,
              reportDate: item.reportDate,
              reportType: item.reportType,
            })),
            {
              companyId: {
                in: companyCodes,
              },
              reportDate: {
                gte: startDate,
              },
              reportType: {
                in: otherPeriods,
              },
            },
          ],
        };
      }
    }
  } else {
    // 常规的报告期筛选
    const validPeriods = ['Q1', 'Q2', 'Q3', 'Q4'];
    const mappedReportPeriods = reportPeriodsArray.filter(period => validPeriods.includes(period));

    if (mappedReportPeriods.length === 0) {
      return res.status(400).json({ message: '无效的报告期' });
    }

    whereConditions.reportType = {
      in: mappedReportPeriods,
    };
  }

  // 获取所有公司的财务指标数据
  // @ts-ignore
  const allFinancialIndicators = await prisma.companyFinancialIndicators.findMany({
    where: whereConditions,
    orderBy: {
      reportDate: 'desc',
    },
  });

  if (!allFinancialIndicators || allFinancialIndicators.length === 0) {
    return res.status(200).json([]);
  }

  // 按日期和报告期分组数据
  const dataByPeriod = new Map<string, any[]>();
  
  allFinancialIndicators.forEach((indicator: any) => {
    const key = `${indicator.reportDate.toISOString()}_${indicator.reportType}`;
    if (!dataByPeriod.has(key)) {
      dataByPeriod.set(key, []);
    }
    dataByPeriod.get(key)!.push(indicator);
  });

  // 计算每个时期的平均值
  const processedData = await Promise.all(
    Array.from(dataByPeriod.entries()).map(async ([periodKey, periodData]) => {
      const [dateStr, reportType] = periodKey.split('_');
      const reportDate = new Date(dateStr);
      
      // 计算平均值
      const averageIndicatorData = calculateAverageIndicatorData(periodData, type);
      
      // 查找上一年同期数据用于计算同比
      const previousYear = reportDate.getFullYear() - 1;
      const previousYearKey = `${new Date(previousYear, reportDate.getMonth(), reportDate.getDate()).toISOString()}_${reportType}`;
      
      let previousYearAverageData: any = {};
      if (dataByPeriod.has(previousYearKey)) {
        previousYearAverageData = calculateAverageIndicatorData(dataByPeriod.get(previousYearKey)!, type);
      } else {
        // 从数据库查询上一年数据
        const previousYearDate = new Date(previousYear, reportDate.getMonth(), reportDate.getDate());
        
        // @ts-ignore
        const previousYearData = await prisma.companyFinancialIndicators.findMany({
          where: {
            companyId: {
              in: companyCodes,
            },
            reportDate: previousYearDate,
            reportType: reportType,
          },
        });
        
        if (previousYearData.length > 0) {
          previousYearAverageData = calculateAverageIndicatorData(previousYearData, type);
        }
      }

      // 转换数据格式
      const items = Object.keys(averageIndicatorData)
        .map((key) => {
          const currentValue = averageIndicatorData[key];
          let yoy = undefined;

          if (previousYearAverageData[key] !== undefined && previousYearAverageData[key] !== null && previousYearAverageData[key] !== 0) {
            const previousValue = previousYearAverageData[key];
            if (currentValue !== null && currentValue !== undefined) {
              yoy = ((currentValue - previousValue) / previousValue) * 100;
            }
          }

          const formattedValue = formatIndicatorValue(currentValue, key);

          return {
            name: key,
            displayName: getFieldDisplayName(key, true),
            value: currentValue,
            formattedValue: formattedValue,
            unit: getFieldUnit(key),
            yoy: yoy
          };
        });

      return {
        date: reportDate,
        items: items
      };
    })
  );

  // 按日期排序
  processedData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return res.status(200).json(processedData);
}

// 根据指标类型获取对应的数据
function getIndicatorDataByType(indicator: any, type: string): any {
  switch (type) {
    case '盈利能力指标':
      return indicator.profitabilityIndicators ? JSON.parse(indicator.profitabilityIndicators) : {};
    case '现金流量指标':
      return indicator.cashFlowIndicators ? JSON.parse(indicator.cashFlowIndicators) : {};
    case '偿债能力指标':
      return indicator.solvencyIndicators ? JSON.parse(indicator.solvencyIndicators) : {};
    case '运营效率指标':
      return indicator.operatingEfficiencyIndicators ? JSON.parse(indicator.operatingEfficiencyIndicators) : {};
    case '成长能力指标':
      return indicator.growthIndicators ? JSON.parse(indicator.growthIndicators) : {};
    case '杜邦分析指标':
      return indicator.dupontIndicators ? JSON.parse(indicator.dupontIndicators) : {};
    case '财务质量指标':
      return indicator.qualityIndicators ? JSON.parse(indicator.qualityIndicators) : {};
    case '市场估值指标':
      return indicator.valuationIndicators ? JSON.parse(indicator.valuationIndicators) : {};
    case '财务风险指标':
      return indicator.riskIndicators ? JSON.parse(indicator.riskIndicators) : {};
    default:
      return {};
  }
}

// 计算财务指标平均值的辅助函数
function calculateAverageIndicatorData(dataList: any[], type: string): any {
  if (dataList.length === 0) return {};
  
  const result: any = {};
  const fieldCounts: any = {};
  
  // 解析所有数据并累加
  dataList.forEach(indicator => {
    try {
      const indicatorData = getIndicatorDataByType(indicator, type);
      
      Object.keys(indicatorData).forEach(key => {
        const value = indicatorData[key];
        // 处理字符串类型的数值
        let numValue = null;
        if (value !== null && value !== undefined) {
          if (typeof value === 'number') {
            numValue = value;
          } else if (typeof value === 'string' && value.trim() !== '') {
            const parsed = parseFloat(value);
            if (!isNaN(parsed)) {
              numValue = parsed;
            }
          }
        }
        
        if (numValue !== null && !isNaN(numValue)) {
          if (!result[key]) {
            result[key] = 0;
            fieldCounts[key] = 0;
          }
          result[key] += numValue;
          fieldCounts[key]++;
        }
      });
    } catch (error) {
      console.error('解析财务指标数据失败:', error);
    }
  });
  
  // 计算平均值
  Object.keys(result).forEach(key => {
    if (fieldCounts[key] > 0) {
      result[key] = result[key] / fieldCounts[key];
    } else {
      result[key] = null;
    }
  });
  
  return result;
} 