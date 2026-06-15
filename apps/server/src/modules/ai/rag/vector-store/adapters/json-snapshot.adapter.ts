import { existsSync, readFileSync } from 'fs'

import { mapLegacySourceTypeToRetrievalSourceType } from '../../rag.types'
import type { RagRetrievalSourceType } from '../../rag.types'
import type { RagSnapshotRuntimeConfig } from '../config'
import type {
  RagVectorChunkPayload,
  RagVectorSearchInput,
  RagVectorSearchMatch,
  RagVectorSnapshotFile,
  RagVectorStore,
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

export class JsonSnapshotRagVectorStoreAdapter implements RagVectorStore {
  readonly backend = 'snapshot' as const
  private cachedPath: string | null = null
  private cachedSnapshot: RagVectorSnapshotFile | null = null

  constructor(private readonly config: RagSnapshotRuntimeConfig) {}

  async upsertChunks(_chunks: RagVectorChunkPayload[]): Promise<void> {}

  async deleteChunksByDocument(_documentId: string): Promise<void> {}

  async listDocumentIds(sourceType?: RagRetrievalSourceType): Promise<string[]> {
    const snapshot = this.readSnapshot()
    return Array.from(
      new Set(
        snapshot.chunks
          .filter((chunk) =>
            sourceType
              ? mapLegacySourceTypeToRetrievalSourceType(chunk.sourceType) === sourceType
              : true,
          )
          .map((chunk) => chunk.documentId),
      ),
    )
  }

  async search(input: RagVectorSearchInput): Promise<RagVectorSearchMatch[]> {
    const snapshot = this.readSnapshot()

    return snapshot.chunks
      .filter((chunk) =>
        input.sourceType ? chunk.sourceType === input.sourceType : true,
      )
      .filter((chunk) =>
        input.sourceTypes?.length
          ? input.sourceTypes.includes(mapLegacySourceTypeToRetrievalSourceType(chunk.sourceType))
          : true,
      )
      .filter((chunk) =>
        input.sourceScope ? chunk.sourceScope === input.sourceScope : true,
      )
      .filter((chunk) =>
        input.knowledgeDomains?.length
          ? input.knowledgeDomains.includes(
              chunk.metadataJson?.knowledgeDomain as (typeof input.knowledgeDomains)[number],
            )
          : true,
      )
      .filter((chunk) =>
        input.documentIds?.length
          ? input.documentIds.includes(chunk.documentId)
          : true,
      )
      .map((chunk) => ({
        ...chunk,
        score: Number(cosineSimilarity(input.queryVector, chunk.embedding).toFixed(6)),
      }))
      .sort((left, right) => right.score - left.score)
      .slice(0, Math.max(Math.floor(input.limit), 0))
  }

  private readSnapshot(): RagVectorSnapshotFile {
    if (this.cachedSnapshot && this.cachedPath === this.config.path) {
      return this.cachedSnapshot
    }

    if (!existsSync(this.config.path)) {
      throw new Error(`RAG vector snapshot file not found: ${this.config.path}`)
    }

    const parsed = JSON.parse(
      readFileSync(this.config.path, 'utf8'),
    ) as RagVectorSnapshotFile

    this.cachedPath = this.config.path
    this.cachedSnapshot = parsed
    return parsed
  }
}
