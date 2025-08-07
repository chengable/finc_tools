import { getRedisClient } from './redis'
import { generateRandomString } from './auth'

// 生成验证码图片（使用简单的Canvas替代方案）
export const generateCaptcha = (): { code: string; base64: string } => {
  const code = generateRandomString(4)
  
  // 创建简单的HTML Canvas来生成图片
  // 由于服务器端限制，这里生成一个简单的SVG并转换为base64
  const svg = `
    <svg width="120" height="40" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="noise" patternUnits="userSpaceOnUse" width="4" height="4">
          <rect width="4" height="4" fill="#f8f8f8"/>
          <circle cx="2" cy="2" r="0.5" fill="#ddd"/>
        </pattern>
      </defs>
      <rect width="120" height="40" fill="url(#noise)"/>
      <rect width="120" height="40" fill="none" stroke="#e0e0e0" stroke-width="1"/>
      ${code.split('').map((char, index) => {
        const x = 15 + index * 22
        const y = 25 + (Math.random() - 0.5) * 8
        const rotation = (Math.random() - 0.5) * 30
        const color = `#${Math.floor(Math.random() * 0x888888 + 0x333333).toString(16)}`
        return `<text x="${x}" y="${y}" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="${color}" transform="rotate(${rotation} ${x} ${y})">${char}</text>`
      }).join('')}
      <line x1="10" y1="${10 + Math.random() * 10}" x2="110" y2="${25 + Math.random() * 10}" stroke="#ccc" stroke-width="1" opacity="0.7"/>
      <line x1="20" y1="${30 + Math.random() * 8}" x2="100" y2="${8 + Math.random() * 8}" stroke="#ccc" stroke-width="1" opacity="0.7"/>
      <line x1="0" y1="${20 + Math.random() * 10}" x2="120" y2="${15 + Math.random() * 10}" stroke="#ddd" stroke-width="1" opacity="0.5"/>
    </svg>
  `
  
  // 转换为base64
  const base64 = Buffer.from(svg).toString('base64')
  
  return {
    code,
    base64: `data:image/svg+xml;base64,${base64}`
  }
}

// 存储验证码到Redis
export const storeCaptcha = async (sessionId: string, code: string): Promise<void> => {
  const client = await getRedisClient()
  await client.setEx(`captcha:${sessionId}`, 300, code) // 5分钟过期
}

// 验证验证码
export const verifyCaptcha = async (sessionId: string, code: string): Promise<boolean> => {
  const client = await getRedisClient()
  const storedCode = await client.get(`captcha:${sessionId}`)
  
  if (storedCode && storedCode.toLowerCase() === code.toLowerCase()) {
    // 验证成功后删除验证码
    await client.del(`captcha:${sessionId}`)
    return true
  }
  
  return false
} 