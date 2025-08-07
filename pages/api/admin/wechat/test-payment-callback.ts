import { requireAdmin, AuthenticatedRequest } from '../../../../lib/admin-middleware'
import { handleWechatPayCallback } from '../../../../lib/wechat-pay'
import { prisma } from '../../../../lib/prisma'
import { NextApiResponse } from 'next'

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: '方法不允许' })
  }

  try {
    const { orderNo } = req.body

    if (!orderNo) {
      return res.status(400).json({ 
        success: false, 
        message: '请提供订单号' 
      })
    }

    // 查找订单
    const order = await prisma.paymentOrder.findUnique({
      where: { orderNo }
    })

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: '订单不存在' 
      })
    }

    if (order.status === 'paid') {
      return res.status(400).json({ 
        success: false, 
        message: '订单已经是支付状态' 
      })
    }

    console.log('管理员手动测试支付回调，订单号:', orderNo)

    // 模拟微信支付成功回调数据
    const mockCallbackData = {
      out_trade_no: orderNo,
      transaction_id: `mock_tx_${Date.now()}`,
      trade_state: 'SUCCESS',
      amount: {
        total: order.amount
      },
      // 添加其他必要字段
      success_time: new Date().toISOString()
    }

    // 构造请求对象
    const mockRequest = {
      body: mockCallbackData,
      headers: {
        'content-type': 'application/json'
      }
    }

    // 调用回调处理函数
    const result = await handleWechatPayCallback(mockRequest)

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: '支付回调测试成功，用户权限已更新',
        data: {
          orderNo,
          callbackResult: result
        }
      })
    } else {
      return res.status(400).json({
        success: false,
        message: '支付回调测试失败: ' + result.message,
        data: {
          orderNo,
          callbackResult: result
        }
      })
    }

  } catch (error) {
    console.error('测试支付回调失败:', error)
    return res.status(500).json({ 
      success: false, 
      message: '服务器内部错误' 
    })
  }
}

export default requireAdmin(handler) 