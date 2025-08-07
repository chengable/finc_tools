import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import jwt from 'jsonwebtoken';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
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
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (error) {
      return res.status(401).json({ 
        success: false,
        message: '登录状态已过期' 
      });
    }

    // 获取用户信息
    let user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    // 如果找不到普通用户，且userid看起来是数字(可能是AdminUser的ID)，尝试查找管理员
    if (!user && /^\d+$/.test(decoded.userId)) {
      // 先尝试通过用户名查找User表中的管理员记录
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

    // 获取查询参数
    const {
      page = '1',
      limit = '10',
      taskName = '',
      status = '',
      username = '' // 管理员用户可根据用户名搜索
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    // 构建查询条件
    const where: any = {};

    // 普通用户只能查看自己的任务，管理员可查看所有任务
    if (user.username !== 'developer') {
      where.userId = user.id;
    } else if (username) {
      // 管理员根据用户名搜索
      const targetUser = await prisma.user.findUnique({
        where: { username: username as string }
      });
      if (targetUser) {
        where.userId = targetUser.id;
      } else {
        // 如果找不到用户，返回空结果
        return res.status(200).json({
          success: true,
          data: {
            tasks: [],
            total: 0,
            page: pageNum,
            limit: limitNum,
            totalPages: 0
          }
        });
      }
    }

    // 任务名称搜索
    if (taskName) {
      where.taskName = {
        contains: taskName as string
      };
    }

    // 状态筛选
    if (status && status !== 'all') {
      where.status = status as string;
    }

    // 查询任务总数
    const total = await prisma.task.count({ where });

    // 查询任务列表
    const tasks = await prisma.task.findMany({
      where,
      include: {
        user: {
          select: {
            username: true,
            nickname: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: offset,
      take: limitNum
    });

    // 格式化返回数据
    const formattedTasks = tasks.map(task => {
      const companies = JSON.parse(task.companies);
      const analysisNodes = JSON.parse(task.analysisNodes);
      
      return {
        taskId: task.taskId8Digit,
        taskName: task.taskName,
        taskType: task.taskType,
        companies,
        status: task.status,
        errorReason: task.errorReason,
        startTime: task.startTime,
        endTime: task.endTime,
        analysisNodes,
        user: task.user
      };
    });

    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      data: {
        tasks: formattedTasks,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages
      }
    });

  } catch (error) {
    console.error('查询任务列表失败:', error);
    res.status(500).json({
      success: false,
      message: '查询任务列表失败'
    });
  }
} 