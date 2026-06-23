import OpenAI from 'openai';

/**
 * OpenAI-compatible AI 客户端配置
 *
 * 通过环境变量配置，支持任意兼容 OpenAI API 的服务：
 * - OPENAI_API_KEY: API 密钥（必填）
 * - OPENAI_BASE_URL: API 基础地址（可选，默认 https://api.openai.com/v1）
 * - OPENAI_MODEL: 模型名称（可选，默认 gpt-4o-mini）
 */
export function createOpenAIClient(): { client: OpenAI; model: string } {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY 环境变量未配置');
  }

  const baseURL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  const client = new OpenAI({
    apiKey,
    baseURL,
  });

  return { client, model };
}
