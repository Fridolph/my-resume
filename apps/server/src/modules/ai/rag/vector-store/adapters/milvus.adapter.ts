import { RagMilvusRuntimeConfig } from '../config'
import {
  createMilvusSdkClient,
  MilvusVectorStoreClient,
} from '../milvus-sdk.client'
import {
  RagVectorSearchInput,
  RagVectorSearchMatch,
  RagVectorStore,
  RagVectorChunkPayload,
} from '../types'

function cosineSimilarity(vectorA: number[], vectorB: number[]): number {
  if (vectorA.length === 0 || vectorB.length === 0) {
    return 0
  }

  const length = Math.min(vectorA.length, vectorB.length)
  let dot = 0
  let magnitudeA = 0
  let magnitudeB = 0

  for (let index = 0; index < length; index += 1) {
    dot += vectorA[index] * vectorB[index]
    magnitudeA += vectorA[index] * vectorA[index]
    magnitudeB += vectorB[index] * vectorB[index]
  }

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0
  }

  return dot / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB))
}

/**
 * Milvus 向量存储适配器（教学骨架）。
 *
 * 说明：
 * - 本轮仅提供 mock 模式，便于先完成契约回归；
 * - `sdk` 模式留给后续步骤接入真实 Milvus Client。
 */
export class MilvusRagVectorStoreAdapter implements RagVectorStore {
  readonly backend = 'milvus' as const
  private readonly mockStore = new Map<string, RagVectorChunkPayload>()
  private sdkClient: MilvusVectorStoreClient | null

  constructor(
    private readonly config: RagMilvusRuntimeConfig,
    sdkClient?: MilvusVectorStoreClient,
  ) {
    this.sdkClient = sdkClient ?? null
  }

  async upsertChunks(chunks: RagVectorChunkPayload[]): Promise<void> {
    if (this.config.mode === 'sdk') {
      await this.getSdkClient().upsertChunks(chunks)
      return
    }

    for (const chunk of chunks) {
      this.mockStore.set(chunk.id, chunk)
    }
  }

  async deleteChunksByDocument(documentId: string): Promise<void> {
    if (this.config.mode === 'sdk') {
      await this.getSdkClient().deleteChunksByDocument(documentId)
      return
    }

    for (const [id, chunk] of this.mockStore.entries()) {
      if (chunk.documentId === documentId) {
        this.mockStore.delete(id)
      }
    }
  }

  async search(input: RagVectorSearchInput): Promise<RagVectorSearchMatch[]> {
    if (this.config.mode === 'sdk') {
      return this.getSdkClient().search(input)
    }

    const candidates = Array.from(this.mockStore.values())
      .filter((chunk) =>
        input.sourceType ? chunk.sourceType === input.sourceType : true,
      )
      .filter((chunk) =>
        input.sourceScope ? chunk.sourceScope === input.sourceScope : true,
      )

    return candidates
      .map((chunk) => ({
        ...chunk,
        score: Number(cosineSimilarity(input.queryVector, chunk.embedding).toFixed(6)),
      }))
      .sort((left, right) => right.score - left.score)
      .slice(0, Math.max(Math.floor(input.limit), 0))
  }

  private getSdkClient(): MilvusVectorStoreClient {
    if (!this.sdkClient) {
      this.sdkClient = createMilvusSdkClient(this.config)
    }

    return this.sdkClient
  }
}
