import { NextApiRequest, NextApiResponse } from 'next'
import { handleWechatPayCallback } from '../../../lib/wechat-pay'
import { IncomingMessage } from 'http'

// 读取原始请求体
function getRawBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => {
      chunks.push(chunk)
    })
    req.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf8'))
    })
    req.on('error', reject)
  })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed')
  }

  try {
    // 读取请求体
    let bodyData: any

    if (req.headers['content-type']?.includes('application/json')) {
      // V3回调（JSON格式）
      bodyData = req.body
    } else {
      // V2回调（XML格式）
    const xmlData = await getRawBody(req)
      // 这里需要解析XML为对象，暂时先使用简单的方式
      // 实际生产环境中需要正确解析XML
      bodyData = { rawXml: xmlData }
    }

    console.log('收到微信支付回调:', bodyData)

    // 构造请求对象
    const reqObj = {
      body: bodyData,
      headers: req.headers
    }

    // 处理回调
    const result = await handleWechatPayCallback(reqObj)

    if (result.success) {
      console.log('微信支付回调处理成功')
      
      // 根据请求类型返回不同格式的响应
      if (req.headers['content-type']?.includes('application/json')) {
        // V3回调返回JSON
        return res.status(200).json({ code: 'SUCCESS', message: '成功' })
      } else {
        // V2回调返回XML
      return res.status(200).send('<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[OK]]></return_msg></xml>')
      }
    } else {
      console.error('微信支付回调处理失败:', result.message)
      
      if (req.headers['content-type']?.includes('application/json')) {
        // V3回调返回JSON
        return res.status(400).json({ code: 'FAIL', message: result.message || '处理失败' })
      } else {
        // V2回调返回XML
      return res.status(400).send(`<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[${result.message || '处理失败'}]]></return_msg></xml>`)
      }
    }

  } catch (error) {
    console.error('微信支付回调API错误:', error)
    
    if (req.headers['content-type']?.includes('application/json')) {
      // V3回调返回JSON
      return res.status(500).json({ code: 'FAIL', message: '服务器内部错误' })
    } else {
      // V2回调返回XML
    return res.status(500).send('<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[服务器内部错误]]></return_msg></xml>')
    }
  }
}

// 禁用默认的body parser，因为我们需要原始XML数据
export const config = {
  api: {
    bodyParser: false,
  },
} 