import { NextApiRequest, NextApiResponse } from 'next'
import { verifyToken } from '../../../lib/auth'
import { manualRenewalCheck } from '../../../lib/payment-scheduler'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: '请求方法不支持' })
  }

  try {
    // 验证管理员身份
    const token = req.cookies.jwt_token || req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return res.status(401).json({ success: false, message: '请先登录' })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.username !== 'developer') {
      return res.status(403).json({ success: false, message: '仅管理员可执行此操作' })
    }

    // 执行手动续费检查
    await manualRenewalCheck()

    return res.status(200).json({
      success: true,
      message: '手动续费检查已执行完成'
    })

  } catch (error) {
    console.error('手动续费检查API错误:', error)
    return res.status(500).json({ success: false, message: '服务器内部错误' })
  }
} 