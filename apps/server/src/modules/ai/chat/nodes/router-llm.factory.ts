import { ChatOpenAI } from '@langchain/openai'

/**
 * 创建路由专用 LLM（关 thinking，支持 function calling）。
 *
 * 背景：thinking 模型不支持 withStructuredOutput，
 * 所有需要结构化输出的节点（route_intent / evaluate / decompose）
 * 必须使用此实例，普通流式生成用 aiService。
 *
 * 配置读取与 AiProvider 保持一致：
 * OPENAI_API_KEY / OPENAI_BASE_URL / OPENAI_CHAT_MODEL
 */
export function createRouterLlm(): ChatOpenAI {
  const configuration: Record<string, unknown> = {
    model: process.env.OPENAI_CHAT_MODEL?.trim() || process.env.OPENAI_MODEL?.trim() || 'deepseek-chat',
    apiKey: process.env.OPENAI_API_KEY?.trim() || 'mock-key',
    temperature: 0,
  }

  const baseURL = process.env.OPENAI_BASE_URL?.trim()
  if (baseURL) {
    configuration.configuration = { baseURL }
  }

  return new ChatOpenAI({
    ...configuration,
    modelKwargs: { thinking: { type: 'disabled' as const } },
  } as any)
}
