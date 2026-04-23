import { RagVectorStoreRuntimeConfig } from './rag-vector-store.config'
import { LocalRagVectorStoreAdapter } from './rag-vector-store.local.adapter'
import { MilvusRagVectorStoreAdapter } from './rag-vector-store.milvus.adapter'
import { RagVectorStore } from './rag-vector-store.types'

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
