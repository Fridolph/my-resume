import { ChatOpenAI } from '@langchain/openai'

/**
 * 创建路由专用 LLM（关 thinking，支持 function calling）。
 *
 * 背景：thinking 模型不支持 withStructuredOutput，
 * 所有需要结构化输出的节点（route_intent / evaluate / decompose）
 * 必须使用此实例，普通流式生成用 aiService。
 *
 * 凭证优先级与 AiConfig 对齐：
 *   1. OPENAI_COMPATIBLE_API_KEY / OPENAI_API_KEY
 *   2. OPENAI_COMPATIBLE_BASE_URL / OPENAI_BASE_URL
 *   3. OPENAI_CHAT_MODEL / OPENAI_MODEL / deepseek-chat
 */
export function createRouterLlm(): ChatOpenAI {
  const apiKey =
    process.env.DEEPSEEK_API_KEY?.trim() ||
    process.env.OPENAI_COMPATIBLE_API_KEY?.trim() ||
    process.env.OPENAI_API_KEY?.trim() ||
    'mock-key'

  const baseURL =
    process.env.DEEPSEEK_BASE_URL?.trim() ||
    process.env.OPENAI_COMPATIBLE_BASE_URL?.trim() ||
    process.env.OPENAI_BASE_URL?.trim()

  const model =
    process.env.DEEPSEEK_MODEL?.trim() ||
    process.env.OPENAI_CHAT_MODEL?.trim() ||
    process.env.OPENAI_MODEL?.trim() ||
    'deepseek-chat'

  const configuration: Record<string, unknown> = {
    model,
    apiKey,
    temperature: 0,
  }

  if (baseURL) {
    configuration.configuration = { baseURL }
  }

  return new ChatOpenAI({
    ...configuration,
    modelKwargs: { thinking: { type: 'disabled' as const } },
  } as any)
}
