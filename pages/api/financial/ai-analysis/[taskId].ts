import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';

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

    const { taskId } = req.query;

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

    let aiAnalysis = null;

    if (task.taskType === 'industry') {
      // 行业分析：查找匹配所有公司代码的行业AI分析
      const companyCodes = companies.map((c: any) => c.code).sort().join(',');
      
      // @ts-ignore
      aiAnalysis = await prisma.companyAiAnalysis.findFirst({
        where: {
          companyCode: companyCodes, // 使用companyCode字段匹配复合公司代码
          analysisStatus: 'completed',
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } else {
      // 企业分析：获取第一个公司的AI分析
      const companyCode = companies[0].code;
      
      // @ts-ignore
      aiAnalysis = await prisma.companyAiAnalysis.findFirst({
        where: {
          companyId: companyCode,
          analysisStatus: 'completed',
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    }

    if (!aiAnalysis) {
      return res.status(404).json({ message: '未找到AI分析建议' });
    }

    return res.status(200).json({
      financialDataAnalysis: aiAnalysis.financialDataAnalysis,
      financialIndicatorAnalysis: aiAnalysis.financialIndicatorAnalysis,
    });
  } catch (error) {
    console.error('获取AI分析建议失败:', error);
    return res.status(500).json({ message: '服务器错误' });
  }
} 