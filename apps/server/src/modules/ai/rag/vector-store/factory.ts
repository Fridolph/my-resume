import { LocalRagVectorStoreAdapter } from './adapters/local.adapter'
import { MilvusRagVectorStoreAdapter } from './adapters/milvus.adapter'
import { RagVectorStoreRuntimeConfig } from './config'
import { RagVectorStore } from './types'

/**
 * 根据运行时配置创建向量存储实现。
 */
export function createRagVectorStore(
  config: RagVectorStoreRuntimeConfig,
): RagVectorStore {
  if (config.backend === 'local') {
    return new LocalRagVectorStoreAdapter()
  }

  if (config.backend === 'milvus') {
    return new MilvusRagVectorStoreAdapter(config.milvus)
  }

  throw new Error(`Unsupported vector store backend: ${(config as { backend: string }).backend}`)
}
