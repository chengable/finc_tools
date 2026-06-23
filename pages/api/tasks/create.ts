import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import * as jwt from 'jsonwebtoken';
import { DataProcessingService } from '../../../lib/dataProcessingService';

interface CreateTaskRequest {
  taskName: string;
  taskType: 'enterprise' | 'industry';
  companies: Array<{
    code: string;
    name: string;
  }>;
  industryName?: string; // 行业名称（仅行业分析使用）
}

// 生成8位数字ID
function generate8DigitId(): string {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
}

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
      return res.status(401).json({ 
        success: false,
        message: '请先登录' 
      });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || '');
    } catch (error) {
      return res.status(401).json({ 
        success: false,
        message: '登录状态已过期' 
      });
    }

    // 获取用户信息
    let user = null;
    
    if (decoded.userType === 'admin') {
      // 管理员用户，通过用户名查找User表中的管理员记录
      user = await prisma.user.findFirst({
        where: { 
          username: decoded.username,
          userType: 'admin'
        }
      });
    } else {
      // 普通用户，通过ID查找
      user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });
    }

    if (!user || !user.canLogin) {
      return res.status(401).json({ 
        success: false,
        message: '用户不存在或被禁用' 
      });
    }

    const { taskName, taskType, companies, industryName }: CreateTaskRequest = req.body;

    // 验证请求参数
    if (!taskName || !taskType || !companies || companies.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: '参数不完整' 
      });
    }

  // 只有专业版用户和管理员才能选择行业分析
    if (taskType === 'industry' && user.userType !== 'premium' && user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '行业分析功能仅适用于专业版用户'
      });
    }

    // 行业分析必须填写行业名称
    if (taskType === 'industry' && (!industryName || !industryName.trim())) {
      return res.status(400).json({ 
        success: false,
        message: '行业分析必须填写行业名称' 
      });
    }

    // 企业分析只能选择一个企业
    if (taskType === 'enterprise' && companies.length > 1) {
      return res.status(400).json({ 
        success: false,
        message: '企业分析只能选择一个企业' 
      });
    }

    // 检查用户任务数量限制
    const taskCount = await prisma.task.count({
      where: { userId: user.id }
    });

    let maxTasks = 2; // 免费用户默认2个
    if (user.userType === 'premium') {
      maxTasks = 50;
    }
    // 管理员用户无限制
    if (user.userType === 'admin') {
      maxTasks = Infinity;
    }

    if (taskCount >= maxTasks) {
      return res.status(403).json({ 
        success: false,
        message: `已达到任务数量上限（${maxTasks}个）` 
      });
    }

    // 生成唯一的8位数字任务ID
    let taskId8Digit: string;
    let attempts = 0;
    do {
      taskId8Digit = generate8DigitId();
      const existing = await prisma.task.findUnique({
        where: { taskId8Digit }
      });
      if (!existing) break;
      attempts++;
    } while (attempts < 10);

    if (attempts >= 10) {
      return res.status(500).json({ 
        success: false,
        message: '生成任务ID失败，请重试' 
      });
    }

    // 创建任务
    const task = await prisma.task.create({
      data: {
        taskId8Digit,
        taskName,
        taskType,
        companies: JSON.stringify(companies),
        industryName: taskType === 'industry' ? industryName : null,
        userId: user.id,
        status: 'analyzing',
        analysisNodes: JSON.stringify({
          collect_data: 'in_progress',
          calculate_data: 'pending'
        })
      }
    });

    // 异步启动数据采集流程
    DataProcessingService.startDataProcessing(task.id, companies).catch(error => {
      console.error('数据处理失败:', error);
    });

    res.status(200).json({
      success: true,
      data: {
        taskId: task.taskId8Digit,
        message: '任务创建成功，正在开始分析...'
      }
    });

  } catch (error) {
    console.error('创建任务失败:', error);
    res.status(500).json({
      success: false,
      message: '创建任务失败'
    });
  }
} 