import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import jwt from 'jsonwebtoken';
import { DataProcessingService } from '../../../../lib/dataProcessingService';

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

    const { taskId } = req.query;

    if (!taskId || typeof taskId !== 'string') {
      return res.status(400).json({ message: '任务ID不能为空' });
    }

    // 查找任务
    const task = await prisma.task.findUnique({
      where: { taskId8Digit: taskId }
    });

    if (!task) {
      return res.status(404).json({ message: '任务不存在' });
    }

    // 检查权限：只有任务创建者或管理员可以重新分析任务
    if (task.userId !== user.id && user.userType !== 'admin') {
      return res.status(403).json({ message: '无权限操作此任务' });
    }

    // 清理旧的AI分析结果（重新分析需要重新生成AI分析）
    const companies = JSON.parse(task.companies);
    
    if (task.taskType === 'industry') {
      // 行业分析：删除行业AI分析结果
      const companyIds = companies.map((c: any) => c.code).sort().join(',');
      await prisma.companyAiAnalysis.deleteMany({
        where: {
          companyCode: companyIds
        }
      });
    } else {
      // 企业分析：删除企业AI分析结果
      for (const company of companies) {
        await prisma.companyAiAnalysis.deleteMany({
          where: {
            companyId: company.code
          }
        });
      }
    }

    // 重置任务状态
    const updatedTask = await prisma.task.update({
      where: { id: task.id },
      data: {
        status: 'analyzing',
        errorReason: null,
        endTime: null,
        analysisNodes: JSON.stringify({
          collect_data: 'in_progress',
          calculate_data: 'pending'
        })
      }
    });

    // 异步启动数据采集流程
    DataProcessingService.startDataProcessing(task.id, companies);

    res.status(200).json({
      success: true,
      message: '重新分析已启动'
    });

  } catch (error) {
    console.error('重新分析任务失败:', error);
    res.status(500).json({
      success: false,
      message: '重新分析任务失败'
    });
  }
}

 