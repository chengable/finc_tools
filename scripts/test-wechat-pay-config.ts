import { getWechatPayConfig, validateWechatPayConfig } from '../lib/wechat-pay'
import { readFileSync, existsSync } from 'fs'

async function testWechatPayConfig() {
  console.log('🔍 开始测试微信支付配置...\n')

  try {
    // 1. 获取配置
    console.log('1. 获取微信支付配置...')
    const config = await getWechatPayConfig()
    
    if (!config) {
      console.error('❌ 微信支付配置未启用或不存在')
      return
    }
    
    console.log('✅ 微信支付配置获取成功')
    console.log(`   - APP ID: ${config.appId}`)
    console.log(`   - 商户号: ${config.merchantId}`)
    console.log(`   - 商户证书序列号: ${config.merchantCertificateSerial}`)
    console.log(`   - 平台证书序列号: ${config.platformCertificateSerial}`)
    
    // 2. 验证配置
    console.log('\n2. 验证配置完整性...')
    const validation = validateWechatPayConfig(config)
    
    if (!validation.isValid) {
      console.error('❌ 配置验证失败:')
      validation.errors.forEach(error => console.error(`   - ${error}`))
      return
    }
    
    console.log('✅ 配置验证通过')
    
    // 3. 检查证书文件
    console.log('\n3. 检查证书文件...')
    
    const files = [
      { name: '商户证书', path: config.merchantCertPath },
      { name: '商户私钥', path: config.merchantKeyPath },
      { name: '平台证书', path: config.platformCertificatePath }
    ]
    
    let allFilesExist = true
    
    for (const file of files) {
      if (existsSync(file.path)) {
        console.log(`✅ ${file.name}: ${file.path}`)
        
        // 检查文件内容
        try {
          const content = readFileSync(file.path, 'utf8')
          if (content.includes('-----BEGIN')) {
            console.log(`   📋 文件格式正确`)
          } else {
            console.log(`   ⚠️  文件格式可能有问题`)
          }
        } catch (err) {
          console.log(`   ❌ 读取文件失败: ${err}`)
          allFilesExist = false
        }
      } else {
        console.error(`❌ ${file.name}文件不存在: ${file.path}`)
        allFilesExist = false
      }
    }
    
    if (!allFilesExist) {
      console.error('\n❌ 证书文件检查失败，请确保所有证书文件都存在且路径正确')
      return
    }
    
    // 4. 测试初始化
    console.log('\n4. 测试微信支付客户端初始化...')
    
    try {
      const { Wechatpay } = require('wechatpay-axios-plugin')
      
      const wxpay = new Wechatpay({
        mchid: config.merchantId,
        serial: config.merchantCertificateSerial,
        privateKey: `file://${config.merchantKeyPath}`,
        certs: {
          [config.platformCertificateSerial]: `file://${config.platformCertificatePath}`,
        },
        secret: config.merchantKey,
        merchant: {
          cert: readFileSync(config.merchantCertPath),
          key: readFileSync(config.merchantKeyPath),
        },
      })
      
      console.log('✅ 微信支付客户端初始化成功')
      
    } catch (initError) {
      console.error('❌ 微信支付客户端初始化失败:')
      console.error(initError)
      return
    }
    
    console.log('\n🎉 微信支付配置测试完成！所有检查都通过了。')
    console.log('\n💡 建议:')
    console.log('   - 现在可以尝试创建测试订单')
    console.log('   - 确保网络连接正常，能访问微信支付API')
    console.log('   - 在生产环境中使用前请先在测试环境验证')
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error)
  }
}

// 如果直接运行这个脚本
if (require.main === module) {
  testWechatPayConfig()
}

export { testWechatPayConfig } 