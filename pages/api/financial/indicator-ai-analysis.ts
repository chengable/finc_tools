import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { prisma } from '../../../lib/prisma';
import { MultiAIProvider } from '../../../lib/ai-provider';
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
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
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
          username: 'developer',
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

    // 检查用户权限：只有付费版用户和管理员可以使用此功能
    if (user.userType !== 'premium' && user.userType !== 'admin' && user.username !== 'developer') {
      return res.status(403).json({ 
        success: false,
        message: '此功能仅限付费版用户和管理员使用' 
      });
    }

    const { taskId, indicatorName, indicatorDisplayName, trendData, timeRange, reportPeriod, companyCode, companyName } = req.body;

    if (!indicatorName || !indicatorDisplayName || !trendData || !timeRange || !reportPeriod || !companyCode) {
      return res.status(400).json({ 
        success: false,
        message: '参数不完整' 
      });
    }

    // 构建缓存键
    const cacheKey: AiAnalysisCacheKey = {
      companyCode,
      companyName,
      analysisType: 'indicator_detail',
      dataItem: indicatorName,
      reportPeriod,
      timeRange
    };

    // 检查缓存
    const cachedResult = await getCachedAnalysis(cacheKey);
    
    if (cachedResult && !cachedResult.isExpired && cachedResult.aiAnalysis) {
      console.log(`使用缓存的AI分析: ${companyCode} - ${indicatorName}`);
      
      // 设置流式响应头
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');
      
      // 模拟流式返回缓存的结果
      const content = cachedResult.aiAnalysis;
      const chunkSize = 50; // 每次发送的字符数
      
      for (let i = 0; i < content.length; i += chunkSize) {
        const chunk = content.slice(i, i + chunkSize);
        const data = JSON.stringify({ content: chunk });
        res.write(`data: ${data}\n\n`);
        
        // 确保数据立即发送到客户端
        if ((res as any).flush) {
          (res as any).flush();
        }
        
        // 添加小延迟以模拟真实的流式体验
        await new Promise(resolve => setTimeout(resolve, 20));
      }
      
      // 发送结束标记
      res.write(`data: [DONE]\n\n`);
      res.end();
      return;
    }

    // 如果缓存不存在或已过期，创建待处理记录
    const pendingCacheId = await createPendingCache(cacheKey);
    
    // 设置流式响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

    // 轮询使用不同的AI提供商
    const provider = await MultiAIProvider.getNextProvider();
    const client = MultiAIProvider.createClient(provider);
    const modelName = MultiAIProvider.getModelName(provider);
    
    console.log(`使用 ${provider} 提供商进行指标AI分析，模型: ${modelName}，公司: ${companyCode}`);

    // 构建分析提示词
    const trendDataText = trendData.map((item: any) => {
      const date = new Date(item.date).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit'
      });
      return `${date}: ${item.formattedValue}${item.unit}`;
    }).join('\n');

    const prompt = `请分析以下财务指标的趋势数据，并给出专业的投资建议。请使用Markdown格式回复，包含适当的标题、列表和强调。

**公司名称**：${companyName || companyCode}
**指标名称**：${indicatorDisplayName}
**时间范围**：${timeRange}
**报告期**：${reportPeriod === 'Q4' ? '年报' : reportPeriod}

**趋势数据**：
${trendDataText}

请从以下几个方面进行分析，并使用Markdown格式组织内容：

## 📈 数据趋势分析
描述该指标在所选时间范围内的变化趋势，包含具体数值变化。

## ✅ 优势分析
指出数据中表现良好的方面，用列表形式展示。

## ⚠️ 风险提示
指出数据中需要关注的风险点，用列表形式展示。

## 💡 投资建议
基于该指标的表现给出具体的投资建议。

请用中文回答，语言要专业但易懂，分析要客观全面。使用Markdown格式，包含标题、列表、粗体等格式。`;

    try {
      // 调用AI进行流式分析
      let completion;
      if (provider === 'bailian') {
        // 百炼API需要特殊的stream_options参数
        completion = await client.chat.completions.create({
          model: modelName,
          messages: [
            {
              role: "system",
              content: "你是一位专业的财务分析师，擅长分析企业财务指标并给出投资建议。请基于提供的数据进行客观、专业的分析。请使用Markdown格式回复，包含适当的标题、列表和强调，让分析结果更易读。"
            },
            {
              role: "user",
              content: prompt
            }
          ],
          stream: true,
          stream_options: {
            include_usage: true
          },
          temperature: 0.7,
          max_tokens: 2000
        });
      } else {
        // 腾讯和火山引擎使用标准流式调用
        completion = await client.chat.completions.create({
          model: modelName,
          messages: [
            {
              role: "system",
              content: "你是一位专业的财务分析师，擅长分析企业财务指标并给出投资建议。请基于提供的数据进行客观、专业的分析。请使用Markdown格式回复，包含适当的标题、列表和强调，让分析结果更易读。"
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
      }

      // 收集完整的AI响应以保存到缓存
      let fullAnalysis = '';

      // 流式返回结果 - 兼容不同AI提供商
      for await (const chunk of completion) {
        // 百炼API的特殊处理：最后一个chunk的choices字段可能为空数组
        if (Array.isArray(chunk.choices) && chunk.choices.length > 0) {
          const content = chunk.choices[0].delta?.content;
          if (content) {
            fullAnalysis += content;
            const data = JSON.stringify({ content });
            res.write(`data: ${data}\n\n`);
            
            // 确保数据立即发送到客户端
            if ((res as any).flush) {
              (res as any).flush();
            }
          }
        }
      }

      // 保存完整的分析结果到缓存
      if (fullAnalysis.trim()) {
        await saveAnalysisToCache(cacheKey, fullAnalysis);
        console.log(`已保存AI分析到缓存: ${companyCode} - ${indicatorName}`);
      }

      // 发送结束标记
      res.write(`data: [DONE]\n\n`);
      res.end();

    } catch (error) {
      console.error(`${provider} AI分析失败:`, error);
      
      // 标记缓存为失败状态
      if (pendingCacheId) {
        await markCacheAsFailed(pendingCacheId, `AI分析失败: ${(error as Error).message}`);
      }
      
      // 发送错误信息
      const errorData = JSON.stringify({ 
        content: `抱歉，AI分析服务暂时不可用，请稍后重试。\n\n**提供商**: ${provider}\n**错误信息**: ${(error as Error).message}`
      });
      res.write(`data: ${errorData}\n\n`);
      res.write(`data: [DONE]\n\n`);
      res.end();
    }

  } catch (error) {
    console.error('指标AI分析失败:', error);
    
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: '指标AI分析失败'
      });
    } else {
      // 如果响应头已发送，发送错误的流式数据
      const errorData = JSON.stringify({ 
        content: '服务器内部错误，请稍后重试。'
      });
      res.write(`data: ${errorData}\n\n`);
      res.write(`data: [DONE]\n\n`);
      res.end();
    }
  }
} 