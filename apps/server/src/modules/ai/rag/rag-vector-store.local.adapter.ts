import {
  RagVectorSearchInput,
  RagVectorSearchMatch,
  RagVectorStore,
  RagVectorChunkPayload,
} from './rag-vector-store.types'

/**
 * local 向量存储适配器（占位实现）。
 *
 * 说明：
 * - 当前主链路仍使用现有本地 RAG 索引文件；
 * - 该适配器用于“可切换架构”的默认后端，不改变现有行为。
 */
export class LocalRagVectorStoreAdapter implements RagVectorStore {
  readonly backend = 'local' as const

  async upsertChunks(_chunks: RagVectorChunkPayload[]): Promise<void> {}

  async deleteChunksByDocument(_documentId: string): Promise<void> {}

  async search(_input: RagVectorSearchInput): Promise<RagVectorSearchMatch[]> {
    return []
  }
}
