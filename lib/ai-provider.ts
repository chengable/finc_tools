import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

// AI服务提供商类型
export type AIProvider = 'bailian' | 'tencent' | 'volcano';

// 多平台AI客户端配置
export class MultiAIProvider {
  private static readonly STATE_FILE = path.join('/tmp', '.ai-provider-state.json');
  
  // 检查哪些AI提供商的API密钥可用
  static getAvailableProviders(): AIProvider[] {
    const allProviders: AIProvider[] = ['bailian', 'tencent', 'volcano'];
    const availableProviders: AIProvider[] = [];
    
    for (const provider of allProviders) {
      try {
        switch (provider) {
          case 'bailian':
            if (process.env.DASHSCOPE_API_KEY) availableProviders.push(provider);
            break;
          case 'tencent':
            if (process.env.TENCENT_API_KEY) availableProviders.push(provider);
            break;
          case 'volcano':
            if (process.env.ARK_API_KEY) availableProviders.push(provider);
            break;
        }
      } catch (error) {
        console.warn(`检查 ${provider} 提供商时出错:`, error);
      }
    }
    
    return availableProviders;
  }

  // 获取下一个要使用的提供商（跨任务轮询）
  static async getNextProvider(): Promise<AIProvider> {
    const providers = this.getAvailableProviders();
    
    console.log('可用的AI提供商:', providers);
    
    if (providers.length === 0) {
      throw new Error('没有可用的AI提供商，请检查API密钥配置');
    }
    
    // 如果只有一个提供商，直接返回
    if (providers.length === 1) {
      console.log('只有一个可用提供商，使用:', providers[0]);
      return providers[0];
    }
    
    try {
      // 从文件读取上次使用的提供商
      let lastUsedProvider: AIProvider = providers[0]; // 使用第一个可用提供商作为默认值
      
      if (fs.existsSync(this.STATE_FILE)) {
        try {
          const stateData = fs.readFileSync(this.STATE_FILE, 'utf8');
          const state = JSON.parse(stateData);
          console.log('读取到的状态文件:', state);
          if (state.lastUsedProvider && providers.includes(state.lastUsedProvider)) {
            lastUsedProvider = state.lastUsedProvider;
          }
        } catch (readError) {
          console.warn('读取AI提供商状态文件失败:', readError);
        }
      } else {
        console.log('状态文件不存在，使用默认提供商:', lastUsedProvider);
      }
      
      // 计算下一个提供商
      const currentIndex = providers.indexOf(lastUsedProvider);
      const nextIndex = (currentIndex + 1) % providers.length;
      const nextProvider = providers[nextIndex];
      
      console.log(`AI提供商轮询: ${lastUsedProvider} -> ${nextProvider} (可用: ${providers.join(', ')})`);
      
      // 将新状态写入文件
      try {
        const newState = {
          lastUsedProvider: nextProvider,
          timestamp: Date.now(),
          availableProviders: providers
        };
        fs.writeFileSync(this.STATE_FILE, JSON.stringify(newState, null, 2));
        console.log('状态文件写入成功:', newState);
      } catch (writeError) {
        console.warn('写入AI提供商状态文件失败:', writeError);
        // 如果写入失败，使用内存轮询作为后备
        return this.getFallbackProvider(providers);
      }
      
      return nextProvider;
    } catch (error) {
      console.error('获取AI提供商失败，使用后备轮询:', error);
      // 如果文件操作失败，使用内存轮询作为后备
      return this.getFallbackProvider(providers);
    }
  }
  
  // 后备的内存轮询（当文件操作失败时）
  private static lastUsedProvider: AIProvider | null = null;
  
  private static getFallbackProvider(availableProviders: AIProvider[]): AIProvider {
    if (availableProviders.length === 0) {
      throw new Error('没有可用的AI提供商');
    }
    
    if (availableProviders.length === 1) {
      return availableProviders[0];
    }
    
    // 如果是第一次调用或上次使用的提供商不在可用列表中，使用第一个
    if (!this.lastUsedProvider || !availableProviders.includes(this.lastUsedProvider)) {
      this.lastUsedProvider = availableProviders[0];
      return availableProviders[1] || availableProviders[0]; // 返回下一个，如果只有一个就返回它自己
    }
    
    const currentIndex = availableProviders.indexOf(this.lastUsedProvider);
    const nextIndex = (currentIndex + 1) % availableProviders.length;
    const nextProvider = availableProviders[nextIndex];
    
    console.log(`后备轮询: ${this.lastUsedProvider} -> ${nextProvider}`);
    this.lastUsedProvider = nextProvider;
    return nextProvider;
  }
  
  // 创建AI客户端
  static createClient(provider: AIProvider): OpenAI {
    let apiKey: string | undefined;
    let baseURL: string;
    
    switch (provider) {
      case 'bailian':
        apiKey = process.env.DASHSCOPE_API_KEY;
        baseURL = "https://dashscope.aliyuncs.com/compatible-mode/v1";
        break;
      case 'tencent':
        apiKey = process.env.TENCENT_API_KEY;
        baseURL = "https://api.lkeap.cloud.tencent.com/v1";
        break;
      case 'volcano':
        apiKey = process.env.ARK_API_KEY;
        baseURL = "https://ark.cn-beijing.volces.com/api/v3";
        break;
      default:
        throw new Error(`不支持的AI提供商: ${provider}`);
    }
    
    if (!apiKey) {
      throw new Error(`${provider} AI提供商的API密钥未配置`);
    }
    
    return new OpenAI({
      apiKey,
      baseURL
    });
  }
  
  // 获取模型名称
  static getModelName(provider: AIProvider): string {
    switch (provider) {
      case 'bailian':
        return 'qwen-max-latest';
      case 'tencent':
        return 'deepseek-r1-0528';
      case 'volcano':
        return 'deepseek-r1-250528';
      default:
        throw new Error(`不支持的AI提供商: ${provider}`);
    }
  }
} 