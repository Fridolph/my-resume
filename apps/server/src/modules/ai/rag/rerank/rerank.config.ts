/**
 * Rerank 模型运行时配置（从环境变量解析）。
 *
 * ## 灰度设计
 *
 * 通过 `RAG_USE_MODEL_RERANK` 控制是否启用 Cross-Encoder 精排：
 * - `false`（默认）：使用手写规则（sectionBoost + keywordBoost）
 * - `true`：使用 qwen3-rerank 模型 API
 *
 * 生产启用前需同时配置 `RERANK_API_KEY` 和 `RERANK_MODEL`。
 */

import type { EnvironmentVariables } from '../rag-search-routing'

/**
 * Rerank 模型运行时配置。
 *
 * 由 `resolveRerankModelConfig()` 从环境变量解析。
 */
export interface RerankModelConfig {
  /** 是否启用模型 Rerank（false = 手写规则） */
  enabled: boolean
  /** API Key（DashScope） */
  apiKey: string
  /** Rerank API 地址（可选，默认 DashScope 官方） */
  baseUrl?: string
  /** 模型名称（默认 qwen3-rerank） */
  model: string
}

/**
 * 从环境变量解析 Rerank 模型配置。
 *
 * 解析逻辑：
 * 1. `RAG_USE_MODEL_RERANK` → `enabled`（仅 `true` 或 `1` 视为启用）
 * 2. `RERANK_API_KEY` → `apiKey`
 * 3. `RERANK_BASE_URL` → `baseUrl`（可选）
 * 4. `RERANK_MODEL` → `model`（默认 `qwen3-rerank`）
 *
 * ## 灰度开关
 *
 * ```
 * RAG_USE_MODEL_RERANK=false  ← 默认：走手写规则
 * RAG_USE_MODEL_RERANK=true   ← 启用：走 Cross-Encoder 模型
 * ```
 *
 * 当 `enabled=true` 但 `apiKey` 为空时，调用方应自行回退到手写规则。
 *
 * @param env - 环境变量对象（通常是 `process.env`）
 * @returns RerankModelConfig
 *
 * @example
 * ```ts
 * const config = resolveRerankModelConfig(process.env)
 * if (config.enabled && config.apiKey) {
 *   const adapter = createDashScopeRerankAdapter(config)
 * }
 * ```
 */
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
