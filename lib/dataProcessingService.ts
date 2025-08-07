import { prisma } from './prisma';
import { mapHkToCnFields } from './field-mappings/hk-to-cn-mapping';
import { mapUsToCnFields } from './field-mappings/us-to-cn-mapping';

interface XueqiuApiResponse {
  data: {
    quote_name: string;
    currency_name: string;
    list: Array<{
      report_date: number;
      report_name: string;
      [key: string]: any;
    }>;
  };
  error_code: number;
  error_description: string;
}

interface Company {
  code: string;
  name: string;
  type?: number;
}

export class DataProcessingService {
  // 用于跟踪已输出字段转换日志的公司，避免重复输出
  private static fieldConversionLoggedCompanies = new Set<string>();
  
  // 启动数据采集和分析流程
  static async startDataProcessing(taskId: string, companies: Company[]) {
    try {
      console.log(`开始处理任务 ${taskId}，企业列表:`, companies);
      
      // 清空字段转换日志记录，确保新任务能输出日志
      this.fieldConversionLoggedCompanies.clear();
      
      // 获取任务信息以确定任务类型
      const task = await prisma.task.findUnique({
        where: { id: taskId }
      });
      
      if (!task) {
        throw new Error('任务不存在');
      }
      
      // 更新任务状态：开始采集数据
      await prisma.task.update({
        where: { id: taskId },
        data: {
          analysisNodes: JSON.stringify({
            collect_data: 'in_progress',
            calculate_data: 'pending'
          })
        }
      });
      
      // 第一步：采集财务数据
      console.log(`任务 ${taskId} - 开始采集财务数据`);
      let dataCollectionFailed = false;
      let failedCompanies: string[] = [];
      
      for (const company of companies) {
        try {
          await this.collectFinancialData(company);
        } catch (error) {
          console.error(`${company.name} 数据采集失败:`, error);
          dataCollectionFailed = true;
          failedCompanies.push(company.name);
        }
      }
      
      // 如果有公司数据采集失败，更新任务状态并抛出错误
      if (dataCollectionFailed) {
        await prisma.task.update({
          where: { id: taskId },
          data: {
            status: 'error',
            errorReason: `数据采集失败，失败的公司: ${failedCompanies.join(', ')}`,
            endTime: new Date(),
            analysisNodes: JSON.stringify({
              collect_data: 'error',
              calculate_data: 'pending'
            })
          }
        });
        throw new Error(`数据采集失败，失败的公司: ${failedCompanies.join(', ')}`);
      }
      
      // 更新任务状态：采集完成，开始计算
      await prisma.task.update({
        where: { id: taskId },
        data: {
          analysisNodes: JSON.stringify({
            collect_data: 'completed',
            calculate_data: 'in_progress'
          })
        }
      });
      
      // 第二步：计算财务指标
      console.log(`任务 ${taskId} - 开始计算财务指标`);
      for (const company of companies) {
        await this.calculateFinancialIndicators(company);
      }
      
      // 更新任务状态为完成
      await prisma.task.update({
        where: { id: taskId },
        data: {
          status: 'completed',
          endTime: new Date(),
          analysisNodes: JSON.stringify({
            collect_data: 'completed',
            calculate_data: 'completed'
          })
        }
      });
      
      console.log(`任务 ${taskId} 处理完成`);
      
    } catch (error) {
      console.error(`任务 ${taskId} 处理失败:`, error);
      
      // 更新任务状态为失败
      await prisma.task.update({
        where: { id: taskId },
        data: {
          status: 'error',
          errorReason: error instanceof Error ? error.message : '未知错误',
          endTime: new Date()
        }
      });
    }
  }
  
  // 采集财务数据
  static async collectFinancialData(company: Company) {
    console.log(`采集 ${company.name} 的财务数据`);
    
    const reportTypes = ['Q1', 'Q2', 'Q3', 'Q4'];
    const dataTypes = ['balance', 'income', 'cashflow'];
    let totalAttempts = 0;
    let successfulAttempts = 0;
    
    for (const reportType of reportTypes) {
      for (const dataType of dataTypes) {
        try {
          // 检查是否已存在3个月内的数据
          const existingData = await this.checkExistingFinancialData(company.code, reportType, dataType);
          if (existingData) {
            console.log(`${company.name} ${reportType} ${dataType} 数据已存在且在3个月内，跳过采集`);
            successfulAttempts++; // 已存在的数据也算成功
            totalAttempts++;
            continue;
          }
          
          totalAttempts++;
          const data = await this.fetchXueqiuData(company.code, reportType, dataType, company.type);
          
          if (data && data.data && data.data.list) {
            // 存储最近10年的数据
            for (const item of data.data.list.slice(0, 10)) {
              await this.saveFinancialData(company, reportType, dataType, item);
            }
            successfulAttempts++;
            console.log(`成功采集 ${company.name} ${reportType} ${dataType} 数据`);
          } else {
            console.error(`采集 ${company.name} ${reportType} ${dataType} 数据失败: 所有市场代码都无法获取有效数据`);
          }
          
          // 添加延迟避免频繁请求
          await new Promise(resolve => setTimeout(resolve, 200));
          
        } catch (error) {
          console.error(`采集 ${company.name} ${reportType} ${dataType} 数据失败:`, error);
        }
      }
    }
    
    // 检查采集成功率，如果成功率过低则抛出错误
    const successRate = totalAttempts > 0 ? (successfulAttempts / totalAttempts) : 0;
    console.log(`${company.name} 数据采集完成，成功率: ${(successRate * 100).toFixed(1)}% (${successfulAttempts}/${totalAttempts})`);
    
    // 如果成功率低于30%，认为采集失败
    if (successRate < 0.3) {
      throw new Error(`${company.name} 数据采集失败，成功率过低: ${(successRate * 100).toFixed(1)}%`);
    }
  }
  
  // 根据公司类型获取市场代码
  static getMarketCode(companyType?: number): string {
    if (companyType === undefined || companyType === null) return 'cn'; // 默认使用cn
    
    switch (companyType) {
      case 0:   // 美股普通股
        return 'us';
      case 11:  // A股主板
      case 12:  // 创业板
      case 82:  // 科创板
      case 83:  // 北交所
        return 'cn';
      case 30:  // 港股主板
      case 31:  // 港股创业板
        return 'hk';
      default:
        return 'cn';
    }
  }

  // 调用雪球API获取数据
  static async fetchXueqiuData(symbol: string, reportType: string, dataType: string, companyType?: number): Promise<XueqiuApiResponse | null> {
    // 首先根据公司类型确定市场代码
    const primaryMarketCode = this.getMarketCode(companyType);
    console.log(`公司 ${symbol} 类型: ${companyType}, 主要市场代码: ${primaryMarketCode}`);
    
    // 先尝试主要市场代码
    try {
      let apiUrl = '';
      
      switch (dataType) {
        case 'balance':
          apiUrl = `https://stock.xueqiu.com/v5/stock/finance/${primaryMarketCode}/balance.json`;
          break;
        case 'income':
          apiUrl = `https://stock.xueqiu.com/v5/stock/finance/${primaryMarketCode}/income.json`;
          break;
        case 'cashflow':
          apiUrl = `https://stock.xueqiu.com/v5/stock/finance/${primaryMarketCode}/cash_flow.json`;
          break;
      }
      
      const url = `${apiUrl}?symbol=${symbol}&type=${reportType}&is_detail=true&count=10&timestamp=${Date.now()}`;
      
      console.log(`尝试获取数据: ${symbol} ${reportType} ${dataType} 市场代码: ${primaryMarketCode} (主要)`);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Referer': 'https://xueqiu.com/',
          'Origin': 'https://xueqiu.com',
          'Cookie': process.env.XUEQIU_COOKIE || ''
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // 检查返回的数据是否有效
        if (data && data.data && data.data.list && data.data.list.length > 0) {
          console.log(`成功获取数据: ${symbol} ${reportType} ${dataType} 市场代码: ${primaryMarketCode} (主要)`);
          return data;
        } else {
          console.log(`数据为空: ${symbol} ${reportType} ${dataType} 市场代码: ${primaryMarketCode} (主要)`);
        }
      } else {
        console.log(`HTTP请求失败: ${response.status} 市场代码: ${primaryMarketCode} (主要)`);
      }
    } catch (error) {
      console.error(`雪球API调用失败: ${symbol} ${reportType} ${dataType} 市场代码: ${primaryMarketCode} (主要)`, error);
    }
    
    // 如果主要市场代码失败，按顺序尝试所有其他市场代码
    const marketCodes = ['us', 'cn', 'hk', 'jp', 'gb', 'de', 'fr', 'ca', 'au', 'kr'];
    const fallbackMarketCodes = marketCodes.filter(code => code !== primaryMarketCode);
    
    for (const marketCode of fallbackMarketCodes) {
      try {
        let apiUrl = '';
        
        switch (dataType) {
          case 'balance':
            apiUrl = `https://stock.xueqiu.com/v5/stock/finance/${marketCode}/balance.json`;
            break;
          case 'income':
            apiUrl = `https://stock.xueqiu.com/v5/stock/finance/${marketCode}/income.json`;
            break;
          case 'cashflow':
            apiUrl = `https://stock.xueqiu.com/v5/stock/finance/${marketCode}/cash_flow.json`;
            break;
        }
        
        const url = `${apiUrl}?symbol=${symbol}&type=${reportType}&is_detail=true&count=10&timestamp=${Date.now()}`;
        
        console.log(`尝试获取数据: ${symbol} ${reportType} ${dataType} 市场代码: ${marketCode} (备用)`);
        
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Referer': 'https://xueqiu.com/',
            'Origin': 'https://xueqiu.com',
            'Cookie': process.env.XUEQIU_COOKIE || ''
          }
        });
        
        if (!response.ok) {
          console.log(`HTTP请求失败: ${response.status} 市场代码: ${marketCode} (备用)`);
          continue;
        }
        
        const data = await response.json();
        
        // 检查返回的数据是否有效
        if (data && data.data && data.data.list && data.data.list.length > 0) {
          console.log(`成功获取数据: ${symbol} ${reportType} ${dataType} 市场代码: ${marketCode} (备用)`);
          return data;
        } else {
          console.log(`数据为空: ${symbol} ${reportType} ${dataType} 市场代码: ${marketCode} (备用)`);
          continue;
        }
        
      } catch (error) {
        console.error(`雪球API调用失败: ${symbol} ${reportType} ${dataType} 市场代码: ${marketCode} (备用)`, error);
        continue;
      }
    }
    
    console.error(`所有市场代码都尝试失败: ${symbol} ${reportType} ${dataType}`);
    return null;
  }
  
  // 保存财务数据
  static async saveFinancialData(company: Company, reportType: string, dataType: string, data: any) {
    try {
      // 获取市场代码以确定是否需要字段转换
      const marketCode = this.getMarketCode(company.type);
      
      // 根据市场代码进行字段转换
      let convertedData = { ...data };
      
      if (marketCode === 'hk') {
        // 港股字段转换
        convertedData = mapHkToCnFields(data, dataType as 'balance' | 'income' | 'cashflow');
        
        // 只在第一次转换时输出日志
        const logKey = `${company.code}_hk`;
        if (!this.fieldConversionLoggedCompanies.has(logKey)) {
          console.log(`港股字段转换: ${company.name}`);
          this.fieldConversionLoggedCompanies.add(logKey);
        }
      } else if (marketCode === 'us') {
        // 美股字段转换
        convertedData = mapUsToCnFields(data, dataType as 'balance' | 'income' | 'cashflow');
        
        // 只在第一次转换时输出日志
        const logKey = `${company.code}_us`;
        if (!this.fieldConversionLoggedCompanies.has(logKey)) {
          console.log(`美股字段转换: ${company.name}`);
          this.fieldConversionLoggedCompanies.add(logKey);
        }
      }
      // CN市场数据不需要转换，直接使用原始数据
      
      await prisma.companyFinancialData.upsert({
        where: {
          companyId_reportType_reportDate_dataType: {
            companyId: company.code,
            reportType,
            reportDate: new Date(convertedData.report_date),
            dataType
          }
        },
        update: {
          financialData: JSON.stringify(convertedData)
        },
        create: {
          companyId: company.code,
          companyName: company.name,
          companyCode: company.code,
          reportType,
          reportDate: new Date(convertedData.report_date),
          reportName: convertedData.report_name || '',
          dataType,
          financialData: JSON.stringify(convertedData)
        }
      });
    } catch (error) {
      console.error(`保存财务数据失败: ${company.name}`, error);
    }
  }
  
  // 计算财务指标
  static async calculateFinancialIndicators(company: Company) {
    console.log(`计算 ${company.name} 的财务指标`);
    try {
      // 1. 计算最近一期的财务指标
      const latestReportType = await this.getLatestReportType(company.code);
      if (latestReportType) {
        await this.calculateIndicatorsForReportType(company, latestReportType);
      }

      // 2. 计算过去10年所有Q4年报的财务指标
      // 获取10年Q4的balance/income/cashflow数据
      const annualBalances = await this.getFinancialData(company.code, 'Q4', 'balance');
      const annualIncomes = await this.getFinancialData(company.code, 'Q4', 'income');
      const annualCashflows = await this.getFinancialData(company.code, 'Q4', 'cashflow');
      // 以balance为主，遍历每一年Q4
      if (annualBalances && annualBalances.length > 0) {
        for (let i = 0; i < annualBalances.length; i++) {
          const balanceData = annualBalances.slice(i, i + 2); // 当前年和上一年
          const incomeData = annualIncomes ? annualIncomes.slice(i, i + 2) : [];
          const cashflowData = annualCashflows ? annualCashflows.slice(i, i + 2) : [];
          const reportDate = balanceData[0]?.report_date;
          if (!reportDate) continue;
          // 检查该年Q4指标是否已存在
          const exist = await this.checkExistingFinancialIndicators(company.code, 'Q4', reportDate);
          if (exist) continue;
          // 计算各类指标
          const profitabilityIndicators = this.calculateProfitabilityIndicators(balanceData, incomeData, cashflowData);
          const cashFlowIndicators = this.calculateCashFlowIndicators(balanceData, incomeData, cashflowData);
          const solvencyIndicators = this.calculateSolvencyIndicators(balanceData, incomeData, cashflowData);
          const operatingEfficiencyIndicators = this.calculateOperatingEfficiencyIndicators(balanceData, incomeData, cashflowData);
          const growthIndicators = this.calculateGrowthIndicators(balanceData, incomeData, cashflowData);
          const dupontIndicators = this.calculateDupontIndicators(balanceData, incomeData, cashflowData);
          const qualityIndicators = this.calculateQualityIndicators(balanceData, incomeData, cashflowData);
          const valuationIndicators = this.calculateValuationIndicators(balanceData, incomeData, cashflowData);
          const riskIndicators = this.calculateRiskIndicators(balanceData, incomeData, cashflowData);
          // 保存
          await this.saveFinancialIndicators(
            company,
            'Q4',
            new Date(reportDate),
            {
              profitabilityIndicators,
              cashFlowIndicators,
              solvencyIndicators,
              operatingEfficiencyIndicators,
              growthIndicators,
              dupontIndicators,
              qualityIndicators,
              valuationIndicators,
              riskIndicators
            }
          );
        }
      }
    } catch (error) {
      console.error(`计算 ${company.name} 财务指标失败:`, error);
    }
  }
  
  // 获取最新的报告期类型
  static async getLatestReportType(companyId: string): Promise<string | null> {
    try {
      const latestRecord = await prisma.companyFinancialData.findFirst({
        where: {
          companyId,
        },
        orderBy: {
          reportDate: 'desc'
        }
      });
      
      return latestRecord?.reportType || null;
    } catch (error) {
      console.error(`获取最新报告期类型失败: ${companyId}`, error);
      return null;
    }
  }
  
  // 计算指定报告期的财务指标
  static async calculateIndicatorsForReportType(company: Company, reportType: string) {
    try {
      // 检查是否已存在3个月内的财务指标数据
      const existingIndicators = await this.checkExistingFinancialIndicators(company.code, reportType);
      if (existingIndicators) {
        console.log(`${company.name} ${reportType} 财务指标已存在且在3个月内，跳过计算`);
        return;
      }
      
      // 获取财务数据
      const balanceData = await this.getFinancialData(company.code, reportType, 'balance');
      const incomeData = await this.getFinancialData(company.code, reportType, 'income');
      const cashflowData = await this.getFinancialData(company.code, reportType, 'cashflow');
      
      if (balanceData && incomeData && cashflowData) {
        // 计算各类指标
        const profitabilityIndicators = this.calculateProfitabilityIndicators(balanceData, incomeData, cashflowData);
        const cashFlowIndicators = this.calculateCashFlowIndicators(balanceData, incomeData, cashflowData);
        const solvencyIndicators = this.calculateSolvencyIndicators(balanceData, incomeData, cashflowData);
        const operatingEfficiencyIndicators = this.calculateOperatingEfficiencyIndicators(balanceData, incomeData, cashflowData);
        const growthIndicators = this.calculateGrowthIndicators(balanceData, incomeData, cashflowData);
        const dupontIndicators = this.calculateDupontIndicators(balanceData, incomeData, cashflowData);
        const qualityIndicators = this.calculateQualityIndicators(balanceData, incomeData, cashflowData);
        const valuationIndicators = this.calculateValuationIndicators(balanceData, incomeData, cashflowData);
        const riskIndicators = this.calculateRiskIndicators(balanceData, incomeData, cashflowData);
        
        // 保存计算结果
        await this.saveFinancialIndicators(
          company,
          reportType,
          balanceData[0]?.report_date ? new Date(balanceData[0].report_date) : new Date(),
          {
            profitabilityIndicators,
            cashFlowIndicators,
            solvencyIndicators,
            operatingEfficiencyIndicators,
            growthIndicators,
            dupontIndicators,
            qualityIndicators,
            valuationIndicators,
            riskIndicators
          }
        );
      }
    } catch (error) {
      console.error(`计算 ${company.name} ${reportType} 财务指标失败:`, error);
    }
  }
  
  // 检查是否已存在3个月内的财务数据
  static async checkExistingFinancialData(companyId: string, reportType: string, dataType: string): Promise<boolean> {
    try {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      
      // @ts-ignore
      const existingRecord = await prisma.companyFinancialData.findFirst({
        where: {
          companyId,
          reportType,
          dataType,
          createdAt: {
            gte: threeMonthsAgo
          }
        }
      });
      
      // 检查记录是否存在且数据不为空
      if (!existingRecord) {
        return false;
      }
      
      // 检查财务数据是否为空
      if (!existingRecord.financialData || existingRecord.financialData.trim() === '') {
        return false;
      }
      
      // 尝试解析JSON数据，确保数据有效
      try {
        const parsedData = JSON.parse(existingRecord.financialData);
        // 检查解析后的数据是否有实际内容
        if (!parsedData || Object.keys(parsedData).length === 0) {
          return false;
        }
      } catch (parseError) {
        console.error(`解析财务数据失败: ${companyId} ${reportType} ${dataType}`, parseError);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error(`检查财务数据是否存在失败: ${companyId} ${reportType} ${dataType}`, error);
      return false;
    }
  }

  // 检查是否已存在3个月内的财务指标数据，支持reportDate
  static async checkExistingFinancialIndicators(companyId: string, reportType: string, reportDate?: string | number | Date): Promise<boolean> {
    try {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      const where: any = {
        companyId,
        reportType,
        createdAt: {
          gte: threeMonthsAgo
        }
      };
      if (reportDate) {
        where.reportDate = new Date(reportDate);
      }
      // @ts-ignore
      const existingRecord = await prisma.companyFinancialIndicators.findFirst({
        where
      });
      
      // 检查记录是否存在且数据不为空
      if (!existingRecord) {
        return false;
      }
      
      // 检查各类指标数据是否为空
      const indicatorFields = [
        'profitabilityIndicators',
        'cashFlowIndicators', 
        'solvencyIndicators',
        'operatingEfficiencyIndicators',
        'growthIndicators',
        'dupontIndicators',
        'qualityIndicators',
        'valuationIndicators',
        'riskIndicators'
      ];
      
      // 至少要有一个指标类型有数据
      let hasValidData = false;
      for (const field of indicatorFields) {
        const fieldData = (existingRecord as any)[field];
        if (fieldData && fieldData.trim() !== '') {
          try {
            const parsedData = JSON.parse(fieldData);
            if (parsedData && Object.keys(parsedData).length > 0) {
              hasValidData = true;
              break;
            }
          } catch (parseError) {
            // 忽略解析错误，继续检查其他字段
          }
        }
      }
      
      return hasValidData;
    } catch (error) {
      console.error(`检查财务指标是否存在失败: ${companyId} ${reportType}`, error);
      return false;
    }
  }

  // 获取财务数据
  static async getFinancialData(companyId: string, reportType: string, dataType: string) {
    try {
      const records = await prisma.companyFinancialData.findMany({
        where: {
          companyId,
          reportType,
          dataType
        },
        orderBy: {
          reportDate: 'desc'
        },
        take: 10
      });
      
      return records.map((record: any) => JSON.parse(record.financialData));
    } catch (error) {
      console.error(`获取财务数据失败: ${companyId} ${reportType} ${dataType}`, error);
      return null;
    }
  }
  
  // 计算盈利能力指标 - 完整实现
  static calculateProfitabilityIndicators(balanceData: any[], incomeData: any[], cashflowData: any[]) {
    const current = incomeData[0] || {};
    const last = incomeData[1] || {};
    const balanceCurrent = balanceData[0] || {};
    const balanceLast = balanceData[1] || {};
    
    const indicators: any = {};
    
    try {
      // 1.1 基础盈利指标
      // 营业收入增长率
      if (current.revenue && last.revenue && last.revenue[0] !== 0) {
        indicators.revenueGrowthRate = (((current.revenue[0] - last.revenue[0]) / last.revenue[0]) * 100).toFixed(2);
      }
      
      // 净利润增长率
      if (current.net_profit && last.net_profit && last.net_profit[0] !== 0) {
        indicators.netProfitGrowthRate = (((current.net_profit[0] - last.net_profit[0]) / last.net_profit[0]) * 100).toFixed(2);
      }
      
      // 毛利率
      if (current.revenue && current.operating_cost && current.revenue[0] !== 0) {
        indicators.grossProfitMargin = (((current.revenue[0] - current.operating_cost[0]) / current.revenue[0]) * 100).toFixed(2);
      }
      
      // 营业利润率
      if (current.op && current.revenue && current.revenue[0] !== 0) {
        indicators.operatingProfitMargin = ((current.op[0] / current.revenue[0]) * 100).toFixed(2);
      }
      
      // 净利润率
      if (current.net_profit && current.revenue && current.revenue[0] !== 0) {
        indicators.netProfitMargin = ((current.net_profit[0] / current.revenue[0]) * 100).toFixed(2);
      }
      
      // 税前利润率
      if (current.profit_total_amt && current.revenue && current.revenue[0] !== 0) {
        indicators.preTaxProfitMargin = ((current.profit_total_amt[0] / current.revenue[0]) * 100).toFixed(2);
      }
      
      // 1.2 期间费用率指标
      // 销售费用率
      if (current.sales_fee && current.revenue && current.revenue[0] !== 0) {
        indicators.salesExpenseRatio = ((current.sales_fee[0] / current.revenue[0]) * 100).toFixed(2);
      }
      
      // 管理费用率
      if (current.manage_fee && current.revenue && current.revenue[0] !== 0) {
        indicators.managementExpenseRatio = ((current.manage_fee[0] / current.revenue[0]) * 100).toFixed(2);
      }
      
      // 研发费用率
      if (current.rad_cost && current.revenue && current.revenue[0] !== 0) {
        indicators.rdExpenseRatio = ((current.rad_cost[0] / current.revenue[0]) * 100).toFixed(2);
      }
      
      // 财务费用率
      if (current.financing_expenses && current.revenue && current.revenue[0] !== 0) {
        indicators.financialExpenseRatio = ((current.financing_expenses[0] / current.revenue[0]) * 100).toFixed(2);
      }
      
      // 期间费用率
      if (current.sales_fee && current.manage_fee && current.rad_cost && current.financing_expenses && current.revenue && current.revenue[0] !== 0) {
        const totalExpenses = (current.sales_fee[0] || 0) + (current.manage_fee[0] || 0) + (current.rad_cost[0] || 0) + (current.financing_expenses[0] || 0);
        indicators.periodExpenseRatio = ((totalExpenses / current.revenue[0]) * 100).toFixed(2);
      }
      
      // 1.3 资产盈利能力指标
      // 总资产收益率(ROA)
      if (current.net_profit && balanceCurrent.total_assets && balanceLast.total_assets) {
        const avgTotalAssets = (balanceCurrent.total_assets[0] + balanceLast.total_assets[0]) / 2;
        if (avgTotalAssets !== 0) {
          indicators.roa = ((current.net_profit[0] / avgTotalAssets) * 100).toFixed(2);
        }
      }
      
      // 净资产收益率(ROE)
      if (current.net_profit_atsopc && balanceCurrent.total_quity_atsopc && balanceLast.total_quity_atsopc) {
        const avgEquity = (balanceCurrent.total_quity_atsopc[0] + balanceLast.total_quity_atsopc[0]) / 2;
        if (avgEquity !== 0) {
          indicators.roe = ((current.net_profit_atsopc[0] / avgEquity) * 100).toFixed(2);
        }
      }
      
      // 总资产净利润率
      if (current.net_profit && balanceCurrent.total_assets && balanceCurrent.total_assets[0] !== 0) {
        indicators.totalAssetNetProfitRatio = ((current.net_profit[0] / balanceCurrent.total_assets[0]) * 100).toFixed(2);
      }
      
      // 净资产净利润率
      if (current.net_profit_atsopc && balanceCurrent.total_quity_atsopc && balanceCurrent.total_quity_atsopc[0] !== 0) {
        indicators.netAssetNetProfitRatio = ((current.net_profit_atsopc[0] / balanceCurrent.total_quity_atsopc[0]) * 100).toFixed(2);
      }
      
      // 1.4 每股指标
      // 基本每股收益
      if (current.basic_eps) {
        indicators.basicEps = current.basic_eps[0];
      }
      
      // 稀释每股收益
      if (current.dlt_earnings_per_share) {
        indicators.dilutedEps = current.dlt_earnings_per_share[0];
      }
      
      // 每股营业收入
      if (current.revenue && balanceCurrent.shares && balanceCurrent.shares[0] !== 0) {
        indicators.revenuePerShare = (current.revenue[0] / balanceCurrent.shares[0]).toFixed(2);
      }
      
      // 每股净资产
      if (balanceCurrent.total_quity_atsopc && balanceCurrent.shares && balanceCurrent.shares[0] !== 0) {
        indicators.netAssetPerShare = (balanceCurrent.total_quity_atsopc[0] / balanceCurrent.shares[0]).toFixed(2);
      }
      
    } catch (error) {
      console.error('计算盈利能力指标失败:', error);
    }
    
    return indicators;
  }
  
  // 计算现金流量指标 - 完整实现
  static calculateCashFlowIndicators(balanceData: any[], incomeData: any[], cashflowData: any[]) {
    const current = cashflowData[0] || {};
    const balanceCurrent = balanceData[0] || {};
    const incomeCurrent = incomeData[0] || {};
    
    const indicators: any = {};
    
    try {
      // 2.1 现金流量结构指标
      // 经营活动现金流量净额
      if (current.ncf_from_oa) {
        indicators.operatingCashFlow = current.ncf_from_oa[0];
      }
      
      // 投资活动现金流量净额
      if (current.ncf_from_ia) {
        indicators.investingCashFlow = current.ncf_from_ia[0];
      }
      
      // 筹资活动现金流量净额
      if (current.ncf_from_fa) {
        indicators.financingCashFlow = current.ncf_from_fa[0];
      }
      
      // 现金净增加额
      if (current.net_increase_in_cce) {
        indicators.netCashIncrease = current.net_increase_in_cce[0];
      }
      
      // 2.2 现金流量质量指标
      // 经营现金流净额/净利润
      if (current.ncf_from_oa && incomeCurrent.net_profit && incomeCurrent.net_profit[0] !== 0) {
        indicators.operatingCashFlowToNetProfit = (current.ncf_from_oa[0] / incomeCurrent.net_profit[0]).toFixed(2);
      }
      
      // 经营现金流净额/营业收入
      if (current.ncf_from_oa && incomeCurrent.revenue && incomeCurrent.revenue[0] !== 0) {
        indicators.operatingCashFlowToRevenue = ((current.ncf_from_oa[0] / incomeCurrent.revenue[0]) * 100).toFixed(2);
      }
      
      // 现金收入比
      if (current.cash_received_of_sales_service && incomeCurrent.revenue && incomeCurrent.revenue[0] !== 0) {
        indicators.cashReceiptRatio = ((current.cash_received_of_sales_service[0] / incomeCurrent.revenue[0]) * 100).toFixed(2);
      }
      
      // 现金成本比
      if (current.goods_buy_and_service_cash_pay && incomeCurrent.operating_cost && incomeCurrent.operating_cost[0] !== 0) {
        indicators.cashCostRatio = ((current.goods_buy_and_service_cash_pay[0] / incomeCurrent.operating_cost[0]) * 100).toFixed(2);
      }
      
      // 资本支出/总资产
      if (current.cash_paid_for_assets && balanceCurrent.total_assets && balanceCurrent.total_assets[0] !== 0) {
        indicators.capexToTotalAssets = ((current.cash_paid_for_assets[0] / balanceCurrent.total_assets[0]) * 100).toFixed(2);
      }
      
      // 2.3 现金管理效率指标
      // 期末现金及现金等价物
      if (current.final_balance_of_cce) {
        indicators.finalCashBalance = current.final_balance_of_cce[0];
      }
      
      // 现金及现金等价物比率 - 使用期末现金及现金等价物/流动负债，以倍数表示
      if (current.final_balance_of_cce && balanceCurrent.total_current_liab && balanceCurrent.total_current_liab[0] !== 0) {
        indicators.cashEquivalentsRatio = (current.final_balance_of_cce[0] / balanceCurrent.total_current_liab[0]).toFixed(2);
      }
      
      // 现金占总资产比例 - 以百分比表示
      if (current.final_balance_of_cce && balanceCurrent.total_assets && balanceCurrent.total_assets[0] !== 0) {
        indicators.cashToTotalAssets = ((current.final_balance_of_cce[0] / balanceCurrent.total_assets[0]) * 100).toFixed(2);
      }
      
    } catch (error) {
      console.error('计算现金流量指标失败:', error);
    }
    
    return indicators;
  }
  
  // 计算偿债能力指标 - 完整实现
  static calculateSolvencyIndicators(balanceData: any[], incomeData: any[], cashflowData: any[]) {
    const current = balanceData[0] || {};
    const incomeCurrent = incomeData[0] || {};
    const cashflowCurrent = cashflowData[0] || {};
    
    const indicators: any = {};
    
    try {
      // 3.1 短期偿债能力指标
      // 流动比率
      if (current.total_current_assets && current.total_current_liab && current.total_current_liab[0] !== 0) {
        indicators.currentRatio = (current.total_current_assets[0] / current.total_current_liab[0]).toFixed(2);
      }
      
      // 速动比率
      if (current.total_current_assets && current.inventory && current.total_current_liab && current.total_current_liab[0] !== 0) {
        const quickAssets = current.total_current_assets[0] - (current.inventory[0] || 0);
        indicators.quickRatio = (quickAssets / current.total_current_liab[0]).toFixed(2);
      }
      
      // 现金比率 - 使用货币资金+交易性金融资产/流动负债，以倍数表示
      if (current.currency_funds && current.total_current_liab && current.total_current_liab[0] !== 0) {
        const cashAndSecurities = (current.currency_funds[0] || 0) + (current.tradable_fnncl_assets ? current.tradable_fnncl_assets[0] || 0 : 0);
        indicators.cashRatio = (cashAndSecurities / current.total_current_liab[0]).toFixed(2);
      }
      
      // 营运资金
      if (current.total_current_assets && current.total_current_liab) {
        indicators.workingCapital = (current.total_current_assets[0] - current.total_current_liab[0]).toFixed(2);
      }
      
      // 3.2 长期偿债能力指标
      // 资产负债率
      if (current.total_liab && current.total_assets && current.total_assets[0] !== 0) {
        indicators.debtToAssetRatio = (current.total_liab[0] / current.total_assets[0]).toFixed(4);
      }
      
      // 权益乘数
      if (current.total_assets && current.total_quity_atsopc && current.total_quity_atsopc[0] !== 0) {
        indicators.equityMultiplier = (current.total_assets[0] / current.total_quity_atsopc[0]).toFixed(2);
      }
      
      // 产权比率
      if (current.total_liab && current.total_quity_atsopc && current.total_quity_atsopc[0] !== 0) {
        indicators.debtToEquityRatio = ((current.total_liab[0] / current.total_quity_atsopc[0]) * 100).toFixed(2);
      }
      
      // 长期债务比率
      if (current.total_noncurrent_liab && current.total_quity_atsopc) {
        const denominator = current.total_noncurrent_liab[0] + current.total_quity_atsopc[0];
        if (denominator !== 0) {
          indicators.longTermDebtRatio = ((current.total_noncurrent_liab[0] / denominator) * 100).toFixed(2);
        }
      }
      
      // 债务股权比
      if (current.total_liab && current.total_quity_atsopc && current.total_quity_atsopc[0] !== 0) {
        indicators.debtEquityRatio = (current.total_liab[0] / current.total_quity_atsopc[0]).toFixed(2);
      }
      
      // 3.3 利息保障指标
      // 利息保障倍数
      if (incomeCurrent.profit_total_amt && incomeCurrent.finance_cost_interest_fee && incomeCurrent.finance_cost_interest_fee[0] !== 0) {
        const ebit = incomeCurrent.profit_total_amt[0] + incomeCurrent.finance_cost_interest_fee[0];
        indicators.interestCoverageRatio = (ebit / incomeCurrent.finance_cost_interest_fee[0]).toFixed(2);
      }
      
      // 现金利息保障倍数
      if (cashflowCurrent.ncf_from_oa && incomeCurrent.finance_cost_interest_fee && incomeCurrent.finance_cost_interest_fee[0] !== 0) {
        indicators.cashInterestCoverageRatio = (cashflowCurrent.ncf_from_oa[0] / incomeCurrent.finance_cost_interest_fee[0]).toFixed(2);
      }
      
    } catch (error) {
      console.error('计算偿债能力指标失败:', error);
    }
    
    return indicators;
  }
  
  // 计算运营效率指标 - 完整实现
  static calculateOperatingEfficiencyIndicators(balanceData: any[], incomeData: any[], cashflowData: any[]) {
    const current = balanceData[0] || {};
    const last = balanceData[1] || {};
    const incomeCurrent = incomeData[0] || {};
    
    const indicators: any = {};
    
    try {
      // 4.1 资产周转率指标
      // 总资产周转率
      if (incomeCurrent.revenue && current.total_assets && last.total_assets) {
        const avgTotalAssets = (current.total_assets[0] + last.total_assets[0]) / 2;
        if (avgTotalAssets !== 0) {
          indicators.totalAssetTurnover = (incomeCurrent.revenue[0] / avgTotalAssets).toFixed(2);
        }
      }
      
      // 流动资产周转率
      if (incomeCurrent.revenue && current.total_current_assets && last.total_current_assets) {
        const avgCurrentAssets = (current.total_current_assets[0] + last.total_current_assets[0]) / 2;
        if (avgCurrentAssets !== 0) {
          indicators.currentAssetTurnover = (incomeCurrent.revenue[0] / avgCurrentAssets).toFixed(2);
        }
      }
      
      // 固定资产周转率
      if (incomeCurrent.revenue && current.fixed_asset && last.fixed_asset) {
        const avgFixedAssets = (current.fixed_asset[0] + last.fixed_asset[0]) / 2;
        if (avgFixedAssets !== 0) {
          indicators.fixedAssetTurnover = (incomeCurrent.revenue[0] / avgFixedAssets).toFixed(2);
        }
      }
      
      // 应收账款周转率
      if (incomeCurrent.revenue && current.account_receivable && last.account_receivable) {
        const avgReceivables = (current.account_receivable[0] + last.account_receivable[0]) / 2;
        if (avgReceivables !== 0) {
          indicators.receivablesTurnover = (incomeCurrent.revenue[0] / avgReceivables).toFixed(2);
        }
      }
      
      // 存货周转率
      if (incomeCurrent.operating_cost && current.inventory && last.inventory) {
        const avgInventory = (current.inventory[0] + last.inventory[0]) / 2;
        if (avgInventory !== 0) {
          indicators.inventoryTurnover = (incomeCurrent.operating_cost[0] / avgInventory).toFixed(2);
        }
      }
      
      // 4.2 周转天数指标
      // 应收账款周转天数
      if (incomeCurrent.revenue && current.account_receivable && last.account_receivable) {
        const avgReceivables = (current.account_receivable[0] + last.account_receivable[0]) / 2;
        const receivablesTurnover = incomeCurrent.revenue[0] / avgReceivables;
        if (receivablesTurnover !== 0) {
          indicators.receivablesTurnoverDays = (365 / receivablesTurnover).toFixed(0);
        }
      }
      
      // 存货周转天数
      if (incomeCurrent.operating_cost && current.inventory && last.inventory) {
        const avgInventory = (current.inventory[0] + last.inventory[0]) / 2;
        const inventoryTurnover = incomeCurrent.operating_cost[0] / avgInventory;
        if (inventoryTurnover !== 0) {
          indicators.inventoryTurnoverDays = (365 / inventoryTurnover).toFixed(0);
        }
      }
      
      // 应付账款周转天数
      if (incomeCurrent.operating_cost && current.accounts_payable && last.accounts_payable) {
        const avgPayables = (current.accounts_payable[0] + last.accounts_payable[0]) / 2;
        const payablesTurnover = incomeCurrent.operating_cost[0] / avgPayables;
        if (payablesTurnover !== 0) {
          indicators.payablesTurnoverDays = (365 / payablesTurnover).toFixed(0);
        }
      }
      
      // 现金转换周期
      if (indicators.receivablesTurnoverDays && indicators.inventoryTurnoverDays && indicators.payablesTurnoverDays) {
        indicators.cashConversionCycle = (
          parseFloat(indicators.receivablesTurnoverDays) + 
          parseFloat(indicators.inventoryTurnoverDays) - 
          parseFloat(indicators.payablesTurnoverDays)
        ).toFixed(0);
      }
      
      // 4.3 资产管理效率指标
      // 应收账款占营业收入比例
      if (current.account_receivable && incomeCurrent.revenue && incomeCurrent.revenue[0] !== 0) {
        indicators.receivablesToRevenue = ((current.account_receivable[0] / incomeCurrent.revenue[0]) * 100).toFixed(2);
      }
      
      // 存货占营业收入比例
      if (current.inventory && incomeCurrent.revenue && incomeCurrent.revenue[0] !== 0) {
        indicators.inventoryToRevenue = ((current.inventory[0] / incomeCurrent.revenue[0]) * 100).toFixed(2);
      }
      
      // 预付账款占营业收入比例
      if (current.pre_payment && incomeCurrent.revenue && incomeCurrent.revenue[0] !== 0) {
        indicators.prepaymentToRevenue = ((current.pre_payment[0] / incomeCurrent.revenue[0]) * 100).toFixed(2);
      }
      
    } catch (error) {
      console.error('计算运营效率指标失败:', error);
    }
    
    return indicators;
  }
  
  // 计算成长能力指标 - 完整实现
  static calculateGrowthIndicators(balanceData: any[], incomeData: any[], cashflowData: any[]) {
    const current = incomeData[0] || {};
    const last = incomeData[1] || {};
    const balanceCurrent = balanceData[0] || {};
    const balanceLast = balanceData[1] || {};
    
    const indicators: any = {};
    
    try {
      // 5.1 收入成长指标
      // 营业收入增长率
      if (current.revenue && last.revenue && last.revenue[0] !== 0) {
        indicators.revenueGrowthRate = (((current.revenue[0] - last.revenue[0]) / last.revenue[0]) * 100).toFixed(2);
      }
      
      // 5.2 利润成长指标
      // 净利润增长率
      if (current.net_profit && last.net_profit && last.net_profit[0] !== 0) {
        indicators.netProfitGrowthRate = (((current.net_profit[0] - last.net_profit[0]) / last.net_profit[0]) * 100).toFixed(2);
      }
      
      // 营业利润增长率
      if (current.op && last.op && last.op[0] !== 0) {
        indicators.operatingProfitGrowthRate = (((current.op[0] - last.op[0]) / last.op[0]) * 100).toFixed(2);
      }
      
      // 5.3 资产成长指标
      // 总资产增长率
      if (balanceCurrent.total_assets && balanceLast.total_assets && balanceLast.total_assets[0] !== 0) {
        indicators.totalAssetGrowthRate = (((balanceCurrent.total_assets[0] - balanceLast.total_assets[0]) / balanceLast.total_assets[0]) * 100).toFixed(2);
      }
      
      // 净资产增长率
      if (balanceCurrent.total_quity_atsopc && balanceLast.total_quity_atsopc && balanceLast.total_quity_atsopc[0] !== 0) {
        indicators.netAssetGrowthRate = (((balanceCurrent.total_quity_atsopc[0] - balanceLast.total_quity_atsopc[0]) / balanceLast.total_quity_atsopc[0]) * 100).toFixed(2);
      }
      
      // 固定资产增长率
      if (balanceCurrent.fixed_asset && balanceLast.fixed_asset && balanceLast.fixed_asset[0] !== 0) {
        indicators.fixedAssetGrowthRate = (((balanceCurrent.fixed_asset[0] - balanceLast.fixed_asset[0]) / balanceLast.fixed_asset[0]) * 100).toFixed(2);
      }
      
    } catch (error) {
      console.error('计算成长能力指标失败:', error);
    }
    
    return indicators;
  }
  
  // 计算杜邦分析指标 - 完整实现
  static calculateDupontIndicators(balanceData: any[], incomeData: any[], cashflowData: any[]) {
    const current = incomeData[0] || {};
    const balanceCurrent = balanceData[0] || {};
    const balanceLast = balanceData[1] || {};
    
    const indicators: any = {};
    
    try {
      // 6.1 杜邦分析核心指标
      // 净资产收益率(ROE)
      if (current.net_profit_atsopc && balanceCurrent.total_quity_atsopc && balanceLast.total_quity_atsopc) {
        const avgEquity = (balanceCurrent.total_quity_atsopc[0] + balanceLast.total_quity_atsopc[0]) / 2;
        if (avgEquity !== 0) {
          indicators.roe = ((current.net_profit_atsopc[0] / avgEquity) * 100).toFixed(2);
        }
      }
      
      // 销售净利率
      if (current.net_profit && current.revenue && current.revenue[0] !== 0) {
        indicators.netProfitMargin = ((current.net_profit[0] / current.revenue[0]) * 100).toFixed(2);
      }
      
      // 总资产周转率
      if (current.revenue && balanceCurrent.total_assets && balanceLast.total_assets) {
        const avgTotalAssets = (balanceCurrent.total_assets[0] + balanceLast.total_assets[0]) / 2;
        if (avgTotalAssets !== 0) {
          indicators.totalAssetTurnover = (current.revenue[0] / avgTotalAssets).toFixed(2);
        }
      }
      
      // 权益乘数
      if (balanceCurrent.total_assets && balanceLast.total_assets && balanceCurrent.total_quity_atsopc && balanceLast.total_quity_atsopc) {
        const avgTotalAssets = (balanceCurrent.total_assets[0] + balanceLast.total_assets[0]) / 2;
        const avgEquity = (balanceCurrent.total_quity_atsopc[0] + balanceLast.total_quity_atsopc[0]) / 2;
        if (avgEquity !== 0) {
          indicators.equityMultiplier = (avgTotalAssets / avgEquity).toFixed(2);
        }
      }
      
      // ROA (用于两因素分解)
      if (current.net_profit && balanceCurrent.total_assets && balanceLast.total_assets) {
        const avgTotalAssets = (balanceCurrent.total_assets[0] + balanceLast.total_assets[0]) / 2;
        if (avgTotalAssets !== 0) {
          indicators.roa = ((current.net_profit[0] / avgTotalAssets) * 100).toFixed(2);
        }
      }
      
    } catch (error) {
      console.error('计算杜邦分析指标失败:', error);
    }
    
    return indicators;
  }
  
  // 计算财务质量指标 - 完整实现
  static calculateQualityIndicators(balanceData: any[], incomeData: any[], cashflowData: any[]) {
    const current = incomeData[0] || {};
    const balanceCurrent = balanceData[0] || {};
    const cashflowCurrent = cashflowData[0] || {};
    
    const indicators: any = {};
    
    try {
      // 7.1 盈利质量指标
      // 经营现金流/净利润
      if (cashflowCurrent.ncf_from_oa && current.net_profit && current.net_profit[0] !== 0) {
        indicators.operatingCashFlowToNetProfit = (cashflowCurrent.ncf_from_oa[0] / current.net_profit[0]).toFixed(2);
      }
      
      // 营业利润/利润总额
      if (current.op && current.profit_total_amt && current.profit_total_amt[0] !== 0) {
        indicators.operatingProfitToTotalProfit = ((current.op[0] / current.profit_total_amt[0]) * 100).toFixed(2);
      }
      
      // 扣非净利润率
      if (current.net_profit_after_nrgal_atsolc && current.revenue && current.revenue[0] !== 0) {
        indicators.coreNetProfitMargin = ((current.net_profit_after_nrgal_atsolc[0] / current.revenue[0]) * 100).toFixed(2);
      }
      
      // 7.2 资产质量指标
      // 流动资产/总资产
      if (balanceCurrent.total_current_assets && balanceCurrent.total_assets && balanceCurrent.total_assets[0] !== 0) {
        indicators.currentAssetToTotalAsset = ((balanceCurrent.total_current_assets[0] / balanceCurrent.total_assets[0]) * 100).toFixed(2);
      }
      
      // 货币资金/总资产
      if (balanceCurrent.currency_funds && balanceCurrent.total_assets && balanceCurrent.total_assets[0] !== 0) {
        indicators.cashToTotalAsset = ((balanceCurrent.currency_funds[0] / balanceCurrent.total_assets[0]) * 100).toFixed(2);
      }
      
      // 应收账款/营业收入
      if (balanceCurrent.account_receivable && current.revenue && current.revenue[0] !== 0) {
        indicators.receivablesToRevenue = ((balanceCurrent.account_receivable[0] / current.revenue[0]) * 100).toFixed(2);
      }
      
      // 存货/营业成本
      if (balanceCurrent.inventory && current.operating_cost && current.operating_cost[0] !== 0) {
        indicators.inventoryToOperatingCost = ((balanceCurrent.inventory[0] / current.operating_cost[0]) * 100).toFixed(2);
      }
      
    } catch (error) {
      console.error('计算财务质量指标失败:', error);
    }
    
    return indicators;
  }
  
  // 计算市场估值指标 - 完整实现
  static calculateValuationIndicators(balanceData: any[], incomeData: any[], cashflowData: any[]) {
    const current = balanceData[0] || {};
    const cashflowCurrent = cashflowData[0] || {};
    
    const indicators: any = {};
    
    try {
      // 8.1 估值相关指标
      // 每股净资产
      if (current.total_quity_atsopc && current.shares && current.shares[0] !== 0) {
        indicators.netAssetPerShare = (current.total_quity_atsopc[0] / current.shares[0]).toFixed(2);
      }
      
      // 每股经营现金流
      if (cashflowCurrent.ncf_from_oa && current.shares && current.shares[0] !== 0) {
        indicators.operatingCashFlowPerShare = (cashflowCurrent.ncf_from_oa[0] / current.shares[0]).toFixed(2);
      }
      
      // 股东权益比率
      if (current.total_quity_atsopc && current.total_assets && current.total_assets[0] !== 0) {
        indicators.equityRatio = ((current.total_quity_atsopc[0] / current.total_assets[0]) * 100).toFixed(2);
      }
      
    } catch (error) {
      console.error('计算市场估值指标失败:', error);
    }
    
    return indicators;
  }
  
  // 计算风险控制指标 - 完整实现
  static calculateRiskIndicators(balanceData: any[], incomeData: any[], cashflowData: any[]) {
    const current = balanceData[0] || {};
    const incomeCurrent = incomeData[0] || {};
    const cashflowCurrent = cashflowData[0] || {};
    
    const indicators: any = {};
    
    try {
      // 9.1 财务风险指标
      // 流动比率
      if (current.total_current_assets && current.total_current_liab && current.total_current_liab[0] !== 0) {
        indicators.currentRatio = (current.total_current_assets[0] / current.total_current_liab[0]).toFixed(2);
      }
      
      // 资产负债率
      if (current.total_liab && current.total_assets && current.total_assets[0] !== 0) {
        indicators.debtToAssetRatio = (current.total_liab[0] / current.total_assets[0]).toFixed(4);
      }
      
      // 现金债务比
      if (cashflowCurrent.ncf_from_oa && current.total_liab && current.total_liab[0] !== 0) {
        indicators.cashDebtRatio = (cashflowCurrent.ncf_from_oa[0] / current.total_liab[0]).toFixed(2);
      }
      
      // 债务保障倍数
      if (cashflowCurrent.ncf_from_oa && current.st_loan && current.lt_loan) {
        const totalDebt = (current.st_loan[0] || 0) + (current.lt_loan[0] || 0);
        if (totalDebt !== 0) {
          indicators.debtCoverageRatio = (cashflowCurrent.ncf_from_oa[0] / totalDebt).toFixed(2);
        }
      }
      
      // 9.2 经营风险指标
      // 研发费用/营业收入
      if (incomeCurrent.rad_cost && incomeCurrent.revenue && incomeCurrent.revenue[0] !== 0) {
        indicators.rdExpenseRatio = ((incomeCurrent.rad_cost[0] / incomeCurrent.revenue[0]) * 100).toFixed(2);
      }
      
    } catch (error) {
      console.error('计算风险控制指标失败:', error);
    }
    
    return indicators;
  }
  
  // 保存财务指标
  static async saveFinancialIndicators(
    company: Company,
    reportType: string,
    reportDate: Date,
    indicators: any
  ) {
    try {
      await prisma.companyFinancialIndicators.upsert({
        where: {
          companyId_reportType_reportDate: {
            companyId: company.code,
            reportType,
            reportDate
          }
        },
        update: {
          profitabilityIndicators: JSON.stringify(indicators.profitabilityIndicators),
          cashFlowIndicators: JSON.stringify(indicators.cashFlowIndicators),
          solvencyIndicators: JSON.stringify(indicators.solvencyIndicators),
          operatingEfficiencyIndicators: JSON.stringify(indicators.operatingEfficiencyIndicators),
          growthIndicators: JSON.stringify(indicators.growthIndicators),
          dupontIndicators: JSON.stringify(indicators.dupontIndicators),
          qualityIndicators: JSON.stringify(indicators.qualityIndicators),
          valuationIndicators: JSON.stringify(indicators.valuationIndicators),
          riskIndicators: JSON.stringify(indicators.riskIndicators)
        },
        create: {
          companyId: company.code,
          companyName: company.name,
          companyCode: company.code,
          reportType,
          reportDate,
          profitabilityIndicators: JSON.stringify(indicators.profitabilityIndicators),
          cashFlowIndicators: JSON.stringify(indicators.cashFlowIndicators),
          solvencyIndicators: JSON.stringify(indicators.solvencyIndicators),
          operatingEfficiencyIndicators: JSON.stringify(indicators.operatingEfficiencyIndicators),
          growthIndicators: JSON.stringify(indicators.growthIndicators),
          dupontIndicators: JSON.stringify(indicators.dupontIndicators),
          qualityIndicators: JSON.stringify(indicators.qualityIndicators),
          valuationIndicators: JSON.stringify(indicators.valuationIndicators),
          riskIndicators: JSON.stringify(indicators.riskIndicators)
        }
      });
    } catch (error) {
      console.error(`保存财务指标失败: ${company.name}`, error);
    }
  }
} 