import { requireAdmin, AuthenticatedRequest } from '../../../lib/admin-middleware'
import { prisma } from '../../../lib/prisma'
import { NextApiResponse } from 'next'
import { WechatConfig } from '@prisma/client'

interface WechatConfigRequest {
  configType: 'login' | 'payment'
  appId?: string
  appSecret?: string
  callbackUrl?: string
  merchantId?: string
  merchantKey?: string
  payCallbackUrl?: string
  certPath?: string
  keyPath?: string
  status?: 'enabled' | 'disabled'
}

const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  if (req.method === 'GET') {
    // 获取微信配置
    try {
      const configs = await prisma.wechatConfig.findMany({
        orderBy: {
          configType: 'asc'
        }
      })

      // 转换为更友好的格式
      const configMap = configs.reduce((acc: Record<string, any>, config) => {
        acc[config.configType] = config
        return acc
      }, {} as Record<string, any>)

      res.status(200).json({ configs: configMap })
    } catch (error) {
      console.error('Get wechat config error:', error)
      res.status(500).json({ message: '获取配置失败' })
    }
  } else if (req.method === 'POST') {
    // 更新微信配置
    try {
      const configData = req.body as WechatConfigRequest

      if (!configData.configType) {
        return res.status(400).json({ message: '配置类型不能为空' })
      }

      // 检查配置是否已存在
      const existingConfig = await prisma.wechatConfig.findUnique({
        where: { configType: configData.configType }
      })

      let config
      if (existingConfig) {
        // 更新现有配置
        config = await prisma.wechatConfig.update({
          where: { configType: configData.configType },
          data: {
            appId: configData.appId || existingConfig.appId,
            appSecret: configData.appSecret || existingConfig.appSecret,
            callbackUrl: configData.callbackUrl || existingConfig.callbackUrl,
            merchantId: configData.merchantId || existingConfig.merchantId,
            merchantKey: configData.merchantKey || existingConfig.merchantKey,
            payCallbackUrl: configData.payCallbackUrl || existingConfig.payCallbackUrl,
            certPath: configData.certPath || existingConfig.certPath,
            keyPath: configData.keyPath || existingConfig.keyPath,
            status: configData.status || existingConfig.status
          }
        })
      } else {
        // 创建新配置
        config = await prisma.wechatConfig.create({
          data: {
            configType: configData.configType,
            appId: configData.appId,
            appSecret: configData.appSecret,
            callbackUrl: configData.callbackUrl,
            merchantId: configData.merchantId,
            merchantKey: configData.merchantKey,
            payCallbackUrl: configData.payCallbackUrl,
            certPath: configData.certPath,
            keyPath: configData.keyPath,
            status: configData.status || 'disabled'
          }
        })
      }

      res.status(200).json({ 
        message: '配置保存成功',
        config
      })
    } catch (error) {
      console.error('Save wechat config error:', error)
      res.status(500).json({ message: '保存配置失败' })
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' })
  }
}

export default requireAdmin(handler) 