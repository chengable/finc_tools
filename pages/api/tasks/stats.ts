import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: '方法不允许' });
  }

  try {
    // 获取历史任务总数
    const totalTasks = await prisma.task.count();

    res.status(200).json({
      success: true,
      data: {
        totalTasks
      }
    });

  } catch (error) {
    console.error('获取任务统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取任务统计失败'
    });
  }
} 