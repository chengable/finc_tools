import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { prisma } from '../../../lib/prisma';
import { createOpenAIClient } from '../../../lib/ai-provider';
import { 
  getCachedAnalysis, 
  saveAnalysisToCache, 
  createPendingCache, 
  markCacheAsFailed,
  AiAnalysisCacheKey 
} from '../../../lib/ai-analysis-cache';

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

    // 检查用户权限
    if (user.userType !== 'premium' && user.userType !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: '此功能仅限付费版用户和管理员使用' 
      });
    }

    const { taskId, analysisType, forceRefresh = false } = req.body;

    if (!taskId || !analysisType) {
      return res.status(400).json({ message: '参数不完整' });
    }

    if (!['financial_data', 'financial_indicators'].includes(analysisType)) {
      return res.status(400).json({ message: '分析类型不正确' });
    }

    // 获取任务信息
    const task = await prisma.task.findUnique({
      where: { taskId8Digit: taskId }
    });

    if (!task) {
      return res.status(404).json({ message: '任务不存在' });
    }

    // 检查权限
    if (decoded.userType !== 'admin' && task.userId !== decoded.userId) {
      return res.status(403).json({ message: '无权访问此任务' });
    }

    const companies = JSON.parse(task.companies);
    if (companies.length === 0) {
      return res.status(404).json({ message: '任务中没有公司数据' });
    }

    // 构建缓存键 - 使用第一个公司的信息作为代表
    const primaryCompany = companies[0];
    const cacheKey: AiAnalysisCacheKey = {
      companyCode: primaryCompany.code,
      companyName: primaryCompany.name,
      analysisType: analysisType as 'financial_data' | 'financial_indicators',
      reportPeriod: 'Q4', // 整体分析通常使用年报数据
      timeRange: '最近3年' // 整体分析的默认时间范围
    };

    let pendingCacheId: string | null = null;

    try {
      // 只有在非强制刷新时才检查缓存
      if (!forceRefresh) {
        const cachedResult = await getCachedAnalysis(cacheKey);
        
        if (cachedResult && !cachedResult.isExpired && cachedResult.aiAnalysis) {
          console.log(`使用缓存的AI分析: ${primaryCompany.code} - ${analysisType}`);
          
          // 模拟流式返回缓存的结果
          const content = cachedResult.aiAnalysis;
          const chunkSize = 100; // 每次发送的字符数
          
          for (let i = 0; i < content.length; i += chunkSize) {
            const chunk = content.slice(i, i + chunkSize);
            res.write(chunk);
            
            // 确保数据立即发送到客户端
            if ((res as any).flush) {
              (res as any).flush();
            }
            
            // 添加小延迟以模拟真实的流式体验
            await new Promise(resolve => setTimeout(resolve, 30));
          }
          
          res.end();
          return;
        }

        // 如果新缓存没有命中，再检查旧的数据库缓存
        const existingAnalysis = await checkExistingAnalysis(task, analysisType);
        
        if (existingAnalysis) {
          // 直接返回已有的分析结果
          const analysisContent = analysisType === 'financial_data' 
            ? existingAnalysis.financialDataAnalysis 
            : existingAnalysis.financialIndicatorAnalysis;
          
          if (analysisContent && analysisContent.trim()) {
            // 将旧缓存的结果保存到新缓存系统中
            await saveAnalysisToCache(cacheKey, analysisContent);
            
            res.write(analysisContent);
            res.end();
            return;
          }
        }
      }

      // 创建待处理的缓存记录
      pendingCacheId = await createPendingCache(cacheKey);

      // 设置流式响应头
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // 生成AI分析建议
      await generateAIAnalysis(res, task, companies, analysisType, cacheKey, pendingCacheId);

    } catch (error) {
      console.error('AI分析失败:', error);
      
      // 如果有待处理的缓存记录，标记为失败
      if (pendingCacheId) {
        await markCacheAsFailed(pendingCacheId, `AI分析失败: ${(error as Error).message}`);
      }
      
      res.write(`抱歉，AI分析服务暂时不可用，请稍后重试。\n\n**错误信息**: ${(error as Error).message}`);
      res.end();
    }

  } catch (error) {
    console.error('处理请求失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
}

// 检查现有的AI分析结果
async function checkExistingAnalysis(task: any, analysisType: string) {
  const companies = JSON.parse(task.companies);
  
  if (task.taskType === 'industry') {
    // 行业分析
    const companyIds = companies.map((c: any) => c.code).sort().join(',');
    return await prisma.companyAiAnalysis.findFirst({
      where: {
        companyCode: companyIds,
        analysisStatus: 'completed',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  } else {
    // 企业分析
    const companyCode = companies[0].code;
    return await prisma.companyAiAnalysis.findFirst({
      where: {
        companyId: companyCode,
        analysisStatus: 'completed',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}

// 生成AI分析
async function generateAIAnalysis(
  res: NextApiResponse,
  task: any,
  companies: any[],
  analysisType: string,
  cacheKey: AiAnalysisCacheKey,
  pendingCacheId: string | null
) {
  const prompt = await buildPrompt(task, companies, analysisType);

  // 使用 OpenAI-compatible API
  const { client, model } = createOpenAIClient();

  console.log(`使用 OpenAI-compatible API 进行AI分析，模型: ${model}`);

  try {
    const completion = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: "你是一个专业的财务分析师，具有丰富的财务分析经验和深厚的行业知识。请基于提供的数据进行客观、专业的分析。"
        },
        {
          role: "user",
          content: prompt
        }
      ],
      stream: true,
      temperature: 0.7,
      max_tokens: 2000
    });

    let fullContent = "";

    // 流式处理响应
    for await (const chunk of completion) {
      if (Array.isArray(chunk.choices) && chunk.choices.length > 0) {
        const content = chunk.choices[0].delta?.content;
        if (content) {
          fullContent += content;
          res.write(content);

          // 确保数据立即发送到客户端
          if ((res as any).flush) {
            (res as any).flush();
          }
        }
      }
    }

    // 保存AI分析结果到数据库
    await saveAnalysisToDatabase(task, companies, analysisType, fullContent);
    
    // 将分析结果保存到新缓存系统中
    await saveAnalysisToCache(cacheKey, fullContent);
    
    res.end();

  } catch (error) {
    console.error('AI分析失败:', error);
    throw error;
  }
}

// 构建提示词
async function buildPrompt(task: any, companies: any[], analysisType: string): Promise<string> {
  const companyName = task.taskType === 'industry' ? (task.industryName || '未知行业') : companies[0].name;
  
  if (analysisType === 'financial_data') {
    // 财务数据分析
    const financialData = await getLatestFinancialData(companies[0].code);
    const yearlyData = await getRecentYearlyFinancialData(companies[0].code);
    
    return `你是一个专业的财务人员，对${companyName}近三年的财务报表整体数据，进行分析，给出优势表现和需注意的风险。

**最新报告期数据：**
${financialData ? JSON.stringify(financialData, null, 2) : '暂无数据'}

**最近三年Q4数据：**
${yearlyData ? JSON.stringify(yearlyData, null, 2) : '暂无数据'}

请从财务状况变化趋势、盈利能力表现、现金流健康度、资产负债结构、优势表现和风险提示等角度进行专业分析。`;
  } else {
    // 财务指标分析
    const indicators = await getLatestFinancialIndicators(companies[0].code);
    const yearlyIndicators = await getRecentYearlyFinancialIndicators(companies[0].code);
    
    return `你是一个专业的财务人员，对${companyName}近三年的财务指标数据，进行分析，给出优势表现和需注意的风险。

**最新报告期财务指标：**
${indicators ? JSON.stringify(indicators, null, 2) : '暂无数据'}

**最近三年Q4指标：**
${yearlyIndicators ? JSON.stringify(yearlyIndicators, null, 2) : '暂无数据'}

请从盈利能力分析、偿债能力评估、运营效率评价、成长性判断、现金流质量、综合评价、优势亮点和风险警示等角度进行专业分析。`;
  }
}

// 获取最新财务数据
async function getLatestFinancialData(companyId: string) {
  // 获取最新报告期的三张表数据
  const balanceData = await prisma.companyFinancialData.findFirst({
    where: { 
      companyId,
      dataType: 'balance'
    },
    orderBy: { reportDate: 'desc' }
  });
  
  const incomeData = await prisma.companyFinancialData.findFirst({
    where: { 
      companyId,
      dataType: 'income'
    },
    orderBy: { reportDate: 'desc' }
  });
  
  const cashflowData = await prisma.companyFinancialData.findFirst({
    where: { 
      companyId,
      dataType: 'cashflow'
    },
    orderBy: { reportDate: 'desc' }
  });
  
  if (!balanceData && !incomeData && !cashflowData) {
    return null;
  }
  
  return {
    reportDate: balanceData?.reportDate || incomeData?.reportDate || cashflowData?.reportDate,
    reportType: balanceData?.reportType || incomeData?.reportType || cashflowData?.reportType,
    balance: balanceData ? JSON.parse(balanceData.financialData) : null,
    income: incomeData ? JSON.parse(incomeData.financialData) : null,
    cashflow: cashflowData ? JSON.parse(cashflowData.financialData) : null
  };
}

// 获取最近三年Q4财务数据
async function getRecentYearlyFinancialData(companyId: string) {
  // 获取最近三年Q4的三张表数据
  const balanceData = await prisma.companyFinancialData.findMany({
    where: { 
      companyId,
      reportType: 'Q4',
      dataType: 'balance'
    },
    orderBy: { reportDate: 'desc' },
    take: 3
  });
  
  const incomeData = await prisma.companyFinancialData.findMany({
    where: { 
      companyId,
      reportType: 'Q4',
      dataType: 'income'
    },
    orderBy: { reportDate: 'desc' },
    take: 3
  });
  
  const cashflowData = await prisma.companyFinancialData.findMany({
    where: { 
      companyId,
      reportType: 'Q4',
      dataType: 'cashflow'
    },
    orderBy: { reportDate: 'desc' },
    take: 3
  });
  
  // 按年份组织数据
  const yearlyData: any[] = [];
  const years = new Set([
    ...balanceData.map(d => d.reportDate.getFullYear()),
    ...incomeData.map(d => d.reportDate.getFullYear()),
    ...cashflowData.map(d => d.reportDate.getFullYear())
  ]);
  
  Array.from(years).sort((a, b) => b - a).slice(0, 3).forEach(year => {
    const balance = balanceData.find(d => d.reportDate.getFullYear() === year);
    const income = incomeData.find(d => d.reportDate.getFullYear() === year);
    const cashflow = cashflowData.find(d => d.reportDate.getFullYear() === year);
    
    yearlyData.push({
      year,
      reportDate: balance?.reportDate || income?.reportDate || cashflow?.reportDate,
      balance: balance ? JSON.parse(balance.financialData) : null,
      income: income ? JSON.parse(income.financialData) : null,
      cashflow: cashflow ? JSON.parse(cashflow.financialData) : null
    });
  });
  
  return yearlyData;
}

// 获取最新财务指标
async function getLatestFinancialIndicators(companyId: string) {
  return await prisma.companyFinancialIndicators.findFirst({
    where: { companyId },
    orderBy: { reportDate: 'desc' }
  });
}

// 获取最近三年Q4财务指标
async function getRecentYearlyFinancialIndicators(companyId: string) {
  return await prisma.companyFinancialIndicators.findMany({
    where: { 
      companyId,
      reportType: 'Q4'
    },
    orderBy: { reportDate: 'desc' },
    take: 3
  });
}

// 保存分析结果到数据库
async function saveAnalysisToDatabase(
  task: any,
  companies: any[],
  analysisType: string,
  analysisContent: string
) {
  try {
    if (task.taskType === 'industry') {
      // 行业分析
      const companyIds = companies.map((c: any) => c.code).sort().join(',');
      const companyNames = companies.map((c: any) => c.name).join('、');
      
      // 先查找是否存在记录
      const existingRecord = await prisma.companyAiAnalysis.findFirst({
        where: {
          companyCode: companyIds,
          analysisStatus: 'completed'
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (existingRecord) {
        // 更新现有记录
        await prisma.companyAiAnalysis.update({
          where: { id: existingRecord.id },
          data: {
            [analysisType === 'financial_data' ? 'financialDataAnalysis' : 'financialIndicatorAnalysis']: analysisContent,
            analysisStatus: 'completed'
          }
        });
      } else {
        // 创建新记录
        await prisma.companyAiAnalysis.create({
          data: {
            companyId: companyIds,
            companyName: companyNames,
            companyCode: companyIds,
            reportDate: new Date(),
            [analysisType === 'financial_data' ? 'financialDataAnalysis' : 'financialIndicatorAnalysis']: analysisContent,
            analysisStatus: 'completed'
          }
        });
      }
    } else {
      // 企业分析
      const company = companies[0];
      
      // 先查找是否存在记录
      const existingRecord = await prisma.companyAiAnalysis.findFirst({
        where: {
          companyId: company.code,
          analysisStatus: 'completed'
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (existingRecord) {
        // 更新现有记录
        await prisma.companyAiAnalysis.update({
          where: { id: existingRecord.id },
          data: {
            [analysisType === 'financial_data' ? 'financialDataAnalysis' : 'financialIndicatorAnalysis']: analysisContent,
            analysisStatus: 'completed'
          }
        });
      } else {
        // 创建新记录
        await prisma.companyAiAnalysis.create({
          data: {
            companyId: company.code,
            companyName: company.name,
            companyCode: company.code,
            reportDate: new Date(),
            [analysisType === 'financial_data' ? 'financialDataAnalysis' : 'financialIndicatorAnalysis']: analysisContent,
            analysisStatus: 'completed'
          }
        });
      }
    }
  } catch (error) {
    console.error('保存AI分析结果失败:', error);
  }
} 