import { RagSourceScope, RagSourceType } from '../../../database/schema'

/**
 * 向量存储后端类型。
 */
export type RagVectorStoreBackend = 'local' | 'milvus'

/**
 * 向量存储层的统一 chunk 载荷。
 */
export interface RagVectorChunkPayload {
  id: string
  documentId: string
  sourceType: RagSourceType
  sourceScope: RagSourceScope
  sourceVersion: string
  section: string
  content: string
  embedding: number[]
  metadataJson?: Record<string, unknown> | null
}

/**
 * 向量检索输入参数。
 */
export interface RagVectorSearchInput {
  queryVector: number[]
  limit: number
  sourceType?: RagSourceType
  sourceScope?: RagSourceScope
}

/**
 * 向量检索命中结果。
 */
export interface RagVectorSearchMatch extends RagVectorChunkPayload {
  score: number
}

/**
 * 向量存储适配器最小契约。
 *
 * 说明：
 * - 本轮先落“入库与检索接口骨架”；
 * - 检索链路暂不替换现有本地索引逻辑；
 * - 后续可在不改业务层调用方式的前提下切换实现。
 */
export interface RagVectorStore {
  backend: RagVectorStoreBackend
  upsertChunks(chunks: RagVectorChunkPayload[]): Promise<void>
  deleteChunksByDocument(documentId: string): Promise<void>
  search(input: RagVectorSearchInput): Promise<RagVectorSearchMatch[]>
}
