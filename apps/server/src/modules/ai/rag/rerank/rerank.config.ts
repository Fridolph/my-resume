/**
 * Rerank 模型运行时配置（从环境变量解析）。
 */

import type { EnvironmentVariables } from '../rag-search-routing'

export interface RerankModelConfig {
  enabled: boolean
  apiKey: string
  baseUrl?: string
  model: string
}

/** 从环境变量解析 Rerank 模型配置 */
export function resolveRerankModelConfig(env: EnvironmentVariables): RerankModelConfig {
  const enabled =
    env.RAG_USE_MODEL_RERANK?.trim().toLowerCase() === 'true' ||
    env.RAG_USE_MODEL_RERANK?.trim() === '1'

  return {
    enabled,
    apiKey: env.RERANK_API_KEY?.trim() ?? '',
    baseUrl: env.RERANK_BASE_URL?.trim() || undefined,
    model: env.RERANK_MODEL?.trim() || 'qwen3-rerank',
  }
}
