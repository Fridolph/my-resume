import { RagSourceScope } from '../../../database/schema'

export type EnvironmentVariables = Partial<Record<string, string | undefined>>

/**
 * RAG 检索路由配置（灰度开关）。
 */
export interface RagSearchRoutingConfig {
  useVectorStore: boolean
  vectorScope: RagSourceScope | 'all'
  fallbackToLocal: boolean
}

function parseBooleanFlag(value: string | undefined, fallback: boolean): boolean {
  if (!value) {
    return fallback
  }

  const normalized = value.trim().toLowerCase()

  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true
  }

  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false
  }

  return fallback
}

/**
 * 解析检索路由配置。
 *
 * 默认值：
 * - `useVectorStore=false`（不改变当前本地检索行为）
 * - `vectorScope=published`
 * - `fallbackToLocal=true`（向量检索为空时回退本地索引）
 */
export function resolveRagSearchRoutingConfig(
  env: EnvironmentVariables,
): RagSearchRoutingConfig {
  const vectorScope = env.RAG_SEARCH_VECTOR_SCOPE?.trim().toLowerCase() ?? 'published'

  if (vectorScope !== 'draft' && vectorScope !== 'published' && vectorScope !== 'all') {
    throw new Error(`Unsupported RAG_SEARCH_VECTOR_SCOPE: ${vectorScope}`)
  }

  return {
    useVectorStore: parseBooleanFlag(env.RAG_SEARCH_USE_VECTOR_STORE, false),
    vectorScope,
    fallbackToLocal: parseBooleanFlag(env.RAG_SEARCH_VECTOR_FALLBACK_TO_LOCAL, true),
  }
}
