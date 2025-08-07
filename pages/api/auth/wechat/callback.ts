import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../../lib/prisma'
import { generateToken } from '../../../../lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 添加详细日志记录
  console.log('微信登录回调开始:', {
    method: req.method,
    query: req.query,
    timestamp: new Date().toISOString(),
    url: req.url
  })

  if (req.method !== 'GET') {
    console.log('错误: 方法不允许:', req.method)
    return res.status(405).json({ success: false, message: '方法不允许' })
  }

  try {
    const { code, state } = req.query
    console.log('提取的参数:', { code: typeof code, state: typeof state, codeValue: code, stateValue: state })

    if (!code || !state) {
      console.log('错误: 缺少必要参数')
      return res.redirect(302, '/login?error=' + encodeURIComponent('缺少必要参数'))
    }

    // 获取微信配置
    console.log('开始获取微信配置...')
    const wechatConfig = await prisma.wechatConfig.findUnique({
      where: { configType: 'login' }
    })

    console.log('微信配置查询结果:', {
      found: !!wechatConfig,
      status: wechatConfig?.status,
      hasAppId: !!wechatConfig?.appId,
      hasAppSecret: !!wechatConfig?.appSecret
    })

    if (!wechatConfig || wechatConfig.status !== 'enabled') {
      console.log('错误: 微信登录功能未启用')
      return res.redirect(302, '/login?error=' + encodeURIComponent('微信登录功能未启用'))
    }

    if (!wechatConfig.appId || !wechatConfig.appSecret) {
      console.log('错误: 微信配置不完整')
      return res.redirect(302, '/login?error=' + encodeURIComponent('微信配置不完整'))
    }

    // 通过code获取access_token
    console.log('开始获取access_token...')
    const tokenUrl = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${wechatConfig.appId}&secret=${wechatConfig.appSecret}&code=${code}&grant_type=authorization_code`
    const tokenResponse = await fetch(tokenUrl)
    const tokenData = await tokenResponse.json()

    console.log('微信token响应:', {
      hasError: !!tokenData.errcode,
      errcode: tokenData.errcode,
      hasAccessToken: !!tokenData.access_token,
      hasOpenid: !!tokenData.openid,
      hasUnionid: !!tokenData.unionid
    })

    // 处理微信API错误
    if (tokenData.errcode) {
      const errorMessage = getWechatErrorMessage(tokenData.errcode)
      console.log('微信token获取失败:', { errcode: tokenData.errcode, errorMessage })
      return res.redirect(302, '/login?error=' + encodeURIComponent(`微信授权失败: ${errorMessage}`))
    }

    const { access_token, openid, unionid, refresh_token, expires_in } = tokenData

    // 获取用户信息
    console.log('开始获取用户信息...')
    const userInfoUrl = `https://api.weixin.qq.com/sns/userinfo?access_token=${access_token}&openid=${openid}`
    const userInfoResponse = await fetch(userInfoUrl)
    const userInfo = await userInfoResponse.json()

    console.log('微信用户信息响应:', {
      hasError: !!userInfo.errcode,
      errcode: userInfo.errcode,
      hasNickname: !!userInfo.nickname,
      hasAvatar: !!userInfo.headimgurl
    })

    if (userInfo.errcode) {
      const errorMessage = getWechatErrorMessage(userInfo.errcode)
      console.log('微信用户信息获取失败:', { errcode: userInfo.errcode, errorMessage })
      return res.redirect(302, '/login?error=' + encodeURIComponent(`获取用户信息失败: ${errorMessage}`))
    }

    // 优先使用unionid，如果没有则使用openid
    const userUniqueId = unionid || openid
    console.log('用户唯一标识:', { unionid, openid, userUniqueId })

    // 查找现有用户（优先用unionid，兼容openid）
    console.log('开始查找现有用户...')
    let user = await prisma.user.findFirst({
      where: unionid ? {
        OR: [
          { openid: unionid },
          { openid: openid }
        ]
      } : {
        openid: openid
      }
    })

    console.log('用户查询结果:', { found: !!user, userId: user?.id, userType: user?.userType })

    if (user) {
      // 老用户登录
      console.log('更新现有用户信息...')
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLoginTime: new Date(),
          status: 'online',
          // 更新用户信息（头像、昵称可能会变）
          nickname: userInfo.nickname,
          avatar: userInfo.headimgurl,
          // 确保使用unionid作为主要标识
          openid: userUniqueId
        }
      })

      // 检查用户是否被禁用
      if (!user.canLogin) {
        console.log('错误: 用户被禁用')
        return res.redirect(302, '/login?error=' + encodeURIComponent('账户已被禁用，请联系管理员'))
      }
    } else {
      // 新用户注册
      console.log('创建新用户...')
      const userId8Digit = await generateUserId8Digit()
      const username = generateRandomUsername()

      user = await prisma.user.create({
        data: {
          userId8Digit: userId8Digit,
          username: username,
          openid: userUniqueId, // 使用unionid或openid
          nickname: userInfo.nickname || username,
          avatar: userInfo.headimgurl || null,
          userType: 'free', // 新用户默认免费版
          status: 'online',
          canLogin: true,
          paymentType: null,
          expireTime: null,
          lastLoginTime: new Date()
        }
      })
      console.log('新用户创建成功:', { userId: user.id, username: user.username })
    }

    // 生成JWT token
    console.log('生成JWT token...')
    const token = generateToken({
      userId: user.id,
      username: user.username,
      userType: user.userType as 'free' | 'premium' | 'admin'
    })

    // 设置cookie并跳转到任务页面
    console.log('设置cookie并跳转到任务页面...')
    res.setHeader('Set-Cookie', [
      `jwt_token=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}`
    ])

    console.log('微信登录回调成功完成，跳转到/tasks')
    // 跳转到任务页面
    res.redirect(302, '/tasks')

  } catch (error) {
    console.error('微信登录回调处理失败:', error)
    res.redirect(302, '/login?error=' + encodeURIComponent('服务器内部错误'))
  }
}

// 微信API错误码映射
function getWechatErrorMessage(errcode: number): string {
  const errorMap: Record<number, string> = {
    40001: 'AppSecret错误或者AppSecret不属于这个小程序',
    40002: '请确保grant_type字段值为authorization_code',
    40003: 'code无效或不合法的openid',
    40013: '不合法的AppID',
    40014: '不合法的access_token',
    40029: 'code无效',
    40125: '无效的appsecret',
    40163: 'code已被使用',
    41003: '缺少openid参数',
    42001: 'access_token超时',
    42003: 'access_token超时',
    45011: 'API调用太频繁，请稍候再试'
  }
  
  return errorMap[errcode] || `微信API错误 (${errcode})`
}

// 生成8位数字用户ID
async function generateUserId8Digit(): Promise<string> {
  let userId8Digit: string
  let attempts = 0
  const maxAttempts = 10

  do {
    userId8Digit = Math.floor(10000000 + Math.random() * 90000000).toString()
    attempts++
    
    if (attempts >= maxAttempts) {
      throw new Error('生成用户ID失败：达到最大尝试次数')
    }
    
    const existingUser = await prisma.user.findUnique({
      where: { userId8Digit }
    })
    
    if (!existingUser) {
      break
    }
  } while (true)

  return userId8Digit
}

// 生成8位随机字母用户名
function generateRandomUsername(): string {
  const letters = 'abcdefghijklmnopqrstuvwxyz'
  let username = ''
  for (let i = 0; i < 8; i++) {
    username += letters.charAt(Math.floor(Math.random() * letters.length))
  }
  return username
}

// 保存微信token信息（可选功能）
async function saveWechatToken(userId: string, tokenInfo: { access_token: string, refresh_token?: string, expires_in: number }) {
  // 这里可以实现token存储逻辑，用于后续API调用
  // 例如存储到Redis或数据库中
  console.log('保存微信token:', { userId, tokenInfo })
} 