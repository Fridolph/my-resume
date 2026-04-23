export type EnvironmentVariables = Partial<Record<string, string | undefined>>

/**
 * Milvus 运行配置。
 */
export interface RagMilvusRuntimeConfig {
  mode: 'mock' | 'sdk'
  address: string
  database: string
  collection: string
  vectorDimension: number
  token?: string
}

/**
 * 向量存储运行时配置。
 */
export type RagVectorStoreRuntimeConfig =
  | {
      backend: 'local'
    }
  | {
      backend: 'milvus'
      milvus: RagMilvusRuntimeConfig
    }

function readOptionalValue(env: EnvironmentVariables, key: string): string | undefined {
  const value = env[key]?.trim()

  return value ? value : undefined
}

function readPositiveInteger(
  env: EnvironmentVariables,
  key: string,
  fallback: number,
): number {
  const rawValue = readOptionalValue(env, key)

  if (!rawValue) {
    return fallback
  }

  const value = Number(rawValue)

  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${key} must be a positive integer`)
  }

  return value
}

/**
 * 解析向量存储后端配置。
 *
 * 默认使用 local，确保不改变现有链路行为。
 *
 * @param env 环境变量
 * @returns 向量存储运行时配置
 */
export function resolveRagVectorStoreRuntimeConfig(
  env: EnvironmentVariables,
): RagVectorStoreRuntimeConfig {
  const backend = env.RAG_VECTOR_STORE_BACKEND?.trim().toLowerCase() ?? 'local'

  if (backend === 'local') {
    return {
      backend: 'local',
    }
  }

  if (backend === 'milvus') {
    const mode = env.RAG_MILVUS_MODE?.trim().toLowerCase() ?? 'mock'

    if (mode !== 'mock' && mode !== 'sdk') {
      throw new Error(`Unsupported RAG_MILVUS_MODE: ${mode}`)
    }

    return {
      backend: 'milvus',
      milvus: {
        mode,
        address: readOptionalValue(env, 'RAG_MILVUS_ADDRESS') ?? 'http://127.0.0.1:19530',
        database: readOptionalValue(env, 'RAG_MILVUS_DATABASE') ?? 'default',
        collection: readOptionalValue(env, 'RAG_MILVUS_COLLECTION') ?? 'resume_rag_chunks',
        vectorDimension: readPositiveInteger(env, 'RAG_MILVUS_VECTOR_DIMENSION', 1536),
        token: readOptionalValue(env, 'RAG_MILVUS_TOKEN'),
      },
    }
  }

  throw new Error(`Unsupported RAG_VECTOR_STORE_BACKEND: ${backend}`)
}
