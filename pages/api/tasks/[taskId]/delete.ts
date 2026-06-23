import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import jwt from 'jsonwebtoken';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'DELETE') {
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

    // 检查权限：只有任务创建者或管理员可以删除任务
    if (task.userId !== user.id && user.userType !== 'admin') {
      return res.status(403).json({ message: '无权限删除此任务' });
    }

    // 删除任务
    await prisma.task.delete({
      where: { id: task.id }
    });

    res.status(200).json({
      success: true,
      message: '任务删除成功'
    });

  } catch (error) {
    console.error('删除任务失败:', error);
    res.status(500).json({
      success: false,
      message: '删除任务失败'
    });
  }
} 