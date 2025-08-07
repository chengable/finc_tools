import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: '方法不允许'
    })
  }

  // 由于现在直接跳转到微信，不再需要轮询状态
  // 这个API保留是为了兼容性，但实际上不会被使用
  res.status(200).json({
    success: true,
    status: 'redirect',
    message: '请直接在微信中完成登录'
  })
} 