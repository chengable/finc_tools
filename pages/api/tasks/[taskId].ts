import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: '方法不允许' });
  }

  try {
    const token = req.cookies.jwt_token;
    if (!token) {
      return res.status(401).json({ message: '未登录' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ message: '无效的token' });
    }

    const { taskId } = req.query;
    
    // 根据taskId查找任务
    const task = await prisma.task.findUnique({
      where: { taskId8Digit: taskId as string }
    });

    if (!task) {
      return res.status(404).json({ message: '任务不存在' });
    }

    // 检查权限：管理员或任务创建者可以访问
    if (decoded.userType !== 'admin' && task.userId !== decoded.userId) {
      return res.status(403).json({ message: '无权访问此任务' });
    }

    // 解析companies JSON字符串获取公司信息
    let companies = [];
    try {
      companies = JSON.parse(task.companies);
    } catch (error) {
      console.error('解析公司信息失败:', error);
    }

    return res.status(200).json({
      taskName: task.taskName,
      taskType: task.taskType,
      companies: companies,
      industryName: task.industryName,
      status: task.status,
      createdAt: task.createdAt,
    });
  } catch (error) {
    console.error('获取任务详情失败:', error);
    return res.status(500).json({ message: '服务器错误' });
  }
} 