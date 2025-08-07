import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';
import { EXCLUDED_FIELDS, getFieldDisplayName, formatValue, getFieldUnit } from '../../../lib/financial-config';

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
      return await handleIndustryAnalysisData(companies, type as string, timeRange as string, reportPeriods, res);
    } else {
      // 企业分析：返回第一个公司的数据
      const companyCode = companies[0].code;
      return await handleEnterpriseAnalysisData(companyCode, type as string, timeRange as string, reportPeriods, res);
    }
  } catch (error) {
    console.error('获取财务数据失败:', error);
    return res.status(500).json({ message: '服务器错误' });
  }
}

// 处理企业分析数据
async function handleEnterpriseAnalysisData(
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

  // 映射财务数据类型
  const dataTypeMap: { [key: string]: string } = {
    '资产负债表': 'balance',
    '利润表': 'income',
    '现金流表': 'cashflow'
  };

  const dataType = dataTypeMap[type];
  if (!dataType) {
    return res.status(400).json({ message: '不支持的数据类型' });
  }

  // 处理 reportPeriods 参数
  let reportPeriodsArray: string[] = [];
  
  if (Array.isArray(reportPeriods)) {
    reportPeriodsArray = reportPeriods as string[];
  } else if (typeof reportPeriods === 'string') {
    reportPeriodsArray = [reportPeriods];
  } else if (reportPeriods && typeof reportPeriods === 'object') {
    reportPeriodsArray = Object.values(reportPeriods) as string[];
  } else {
    return res.status(400).json({ message: '报告期参数错误' });
  }

  const validPeriods = ['Q1', 'Q2', 'Q3', 'Q4'];
  const mappedReportPeriods = reportPeriodsArray.filter(period => validPeriods.includes(period));

  if (mappedReportPeriods.length === 0) {
    return res.status(400).json({ message: '无效的报告期' });
  }

  // 获取财务数据
  // @ts-ignore
  const financialData = await prisma.companyFinancialData.findMany({
    where: {
      companyId: companyCode,
      dataType: dataType,
      reportDate: {
        gte: startDate,
      },
      reportType: {
        in: mappedReportPeriods,
      },
    },
    orderBy: {
      reportDate: 'desc',
    },
  });

  if (!financialData || financialData.length === 0) {
    return res.status(200).json([]);
  }

  // 处理数据并计算同比
  const processedData = await Promise.all(financialData.map(async (data: any) => {
    const financialDataParsed = JSON.parse(data.financialData);
    
    // 查找上一年同期数据用于计算同比
    let previousYearData = financialData.find(
      (d: any) =>
        d.reportDate.getFullYear() === data.reportDate.getFullYear() - 1 &&
        d.reportType === data.reportType
    );

    if (!previousYearData) {
      const previousYear = data.reportDate.getFullYear() - 1;
      const previousYearDate = new Date(previousYear, data.reportDate.getMonth(), data.reportDate.getDate());
      
      // @ts-ignore
      previousYearData = await prisma.companyFinancialData.findFirst({
        where: {
          companyId: companyCode,
          dataType: dataType,
          reportDate: previousYearDate,
          reportType: data.reportType,
        },
      });
    }

    let previousYearDataParsed = null;
    if (previousYearData) {
      try {
        previousYearDataParsed = JSON.parse((previousYearData as any).financialData);
      } catch (error) {
        console.error('解析上年数据失败:', error);
      }
    }

    // 转换数据格式
    const items = Object.keys(financialDataParsed)
      .filter(key => !EXCLUDED_FIELDS.includes(key))
      .map((key) => {
        let currentValue = null;
        if (financialDataParsed[key] && financialDataParsed[key][0] !== null && financialDataParsed[key][0] !== undefined) {
          const rawValue = financialDataParsed[key][0];
          // 确保值是有效的数字
          const numValue = typeof rawValue === 'number' ? rawValue : parseFloat(String(rawValue));
          if (!isNaN(numValue) && isFinite(numValue)) {
            currentValue = numValue;
          }
        }
        let yoy = undefined;

        if (previousYearDataParsed && previousYearDataParsed[key] && previousYearDataParsed[key][0] !== null && previousYearDataParsed[key][0] !== 0) {
          const previousValue = previousYearDataParsed[key][0];
          if (currentValue !== null) {
            yoy = ((currentValue - previousValue) / previousValue) * 100;
          }
        }

        const formattedValue = formatValue(currentValue, key);

        return {
          name: key,
          displayName: getFieldDisplayName(key, false),
          value: currentValue,
          formattedValue: formattedValue,
          unit: formattedValue ? getFieldUnit(key) : '',
          yoy: yoy
        };
      });

    return {
      date: data.reportDate,
      items: items
    };
  }));

  return res.status(200).json(processedData);
}

// 处理行业分析数据（返回平均值）
async function handleIndustryAnalysisData(
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

  // 映射财务数据类型
  const dataTypeMap: { [key: string]: string } = {
    '资产负债表': 'balance',
    '利润表': 'income',
    '现金流表': 'cashflow'
  };

  const dataType = dataTypeMap[type];
  if (!dataType) {
    return res.status(400).json({ message: '不支持的数据类型' });
  }

  // 处理 reportPeriods 参数
  let reportPeriodsArray: string[] = [];
  
  if (Array.isArray(reportPeriods)) {
    reportPeriodsArray = reportPeriods as string[];
  } else if (typeof reportPeriods === 'string') {
    reportPeriodsArray = [reportPeriods];
  } else if (reportPeriods && typeof reportPeriods === 'object') {
    reportPeriodsArray = Object.values(reportPeriods) as string[];
  } else {
    return res.status(400).json({ message: '报告期参数错误' });
  }

  const validPeriods = ['Q1', 'Q2', 'Q3', 'Q4'];
  const mappedReportPeriods = reportPeriodsArray.filter(period => validPeriods.includes(period));

  if (mappedReportPeriods.length === 0) {
    return res.status(400).json({ message: '无效的报告期' });
  }

  // 获取所有公司的财务数据
  const companyCodes = companies.map(c => c.code);
  
  // @ts-ignore
  const allFinancialData = await prisma.companyFinancialData.findMany({
    where: {
      companyId: {
        in: companyCodes,
      },
      dataType: dataType,
      reportDate: {
        gte: startDate,
      },
      reportType: {
        in: mappedReportPeriods,
      },
    },
    orderBy: {
      reportDate: 'desc',
    },
  });

  if (!allFinancialData || allFinancialData.length === 0) {
    return res.status(200).json([]);
  }

  // 按日期和报告期分组数据
  const dataByPeriod = new Map<string, any[]>();
  
  allFinancialData.forEach((data: any) => {
    const key = `${data.reportDate.toISOString()}_${data.reportType}`;
    if (!dataByPeriod.has(key)) {
      dataByPeriod.set(key, []);
    }
    dataByPeriod.get(key)!.push(data);
  });

  // 计算每个时期的平均值
  const processedData = await Promise.all(
    Array.from(dataByPeriod.entries()).map(async ([periodKey, periodData]) => {
      const [dateStr, reportType] = periodKey.split('_');
      const reportDate = new Date(dateStr);
      
      // 计算平均值
      const averageData = calculateAverageFinancialData(periodData);
      
      // 查找上一年同期数据用于计算同比
      const previousYear = reportDate.getFullYear() - 1;
      const previousYearKey = `${new Date(previousYear, reportDate.getMonth(), reportDate.getDate()).toISOString()}_${reportType}`;
      
      let previousYearAverageData = null;
      if (dataByPeriod.has(previousYearKey)) {
        previousYearAverageData = calculateAverageFinancialData(dataByPeriod.get(previousYearKey)!);
      } else {
        // 从数据库查询上一年数据
        const previousYearDate = new Date(previousYear, reportDate.getMonth(), reportDate.getDate());
        
        // @ts-ignore
        const previousYearData = await prisma.companyFinancialData.findMany({
          where: {
            companyId: {
              in: companyCodes,
            },
            dataType: dataType,
            reportDate: previousYearDate,
            reportType: reportType,
          },
        });
        
        if (previousYearData.length > 0) {
          previousYearAverageData = calculateAverageFinancialData(previousYearData);
        }
      }

      // 转换数据格式
      const items = Object.keys(averageData)
        .filter(key => !EXCLUDED_FIELDS.includes(key))
        .map((key) => {
          const currentValue = averageData[key];
          let yoy = undefined;

          if (previousYearAverageData && previousYearAverageData[key] !== null && previousYearAverageData[key] !== 0) {
            const previousValue = previousYearAverageData[key];
            if (currentValue !== null) {
              yoy = ((currentValue - previousValue) / previousValue) * 100;
            }
          }

          const formattedValue = formatValue(currentValue, key);

          return {
            name: key,
            displayName: getFieldDisplayName(key, false),
            value: currentValue,
            formattedValue: formattedValue,
            unit: formattedValue ? getFieldUnit(key) : '',
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

// 计算财务数据平均值的辅助函数
function calculateAverageFinancialData(dataList: any[]): any {
  if (dataList.length === 0) return {};
  
  const result: any = {};
  const fieldCounts: any = {};
  
  // 解析所有数据并累加
  dataList.forEach(data => {
    try {
      const financialData = JSON.parse(data.financialData);
      
      Object.keys(financialData).forEach(key => {
        if (financialData[key] && financialData[key][0] !== null && financialData[key][0] !== undefined) {
          const value = financialData[key][0];
          // 确保value是有效的数字
          const numValue = typeof value === 'number' ? value : parseFloat(String(value));
          if (!isNaN(numValue) && isFinite(numValue)) {
            if (!result[key]) {
              result[key] = 0;
              fieldCounts[key] = 0;
            }
            result[key] += numValue;
            fieldCounts[key]++;
          }
        }
      });
    } catch (error) {
      console.error('解析财务数据失败:', error);
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