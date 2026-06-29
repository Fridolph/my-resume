import { existsSync, readFileSync } from 'fs'
import { Logger } from '@nestjs/common'

import { mapLegacySourceTypeToRetrievalSourceType } from '../../rag.types'
import type { RagRetrievalSourceType } from '../../rag.types'
import { cosineSimilarity } from '../../utils/math'
import type { RagSnapshotRuntimeConfig } from '../config'
import type {
  RagVectorChunkPayload,
  RagVectorSearchInput,
  RagVectorSearchMatch,
  RagVectorSnapshotFile,
  RagVectorStore,
} from '../types'


export class JsonSnapshotRagVectorStoreAdapter implements RagVectorStore {
  readonly backend = 'snapshot' as const
  private cachedPath: string | null = null
  private cachedSnapshot: RagVectorSnapshotFile | null = null
  private readonly logger = new Logger(JsonSnapshotRagVectorStoreAdapter.name)

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

    const startedAt = Date.now()
    const parsed = JSON.parse(
      readFileSync(this.config.path, 'utf8'),
    ) as RagVectorSnapshotFile

    this.cachedPath = this.config.path
    this.cachedSnapshot = parsed

    this.logger.log({
      event: 'rag.vector_snapshot.loaded',
      path: this.config.path,
      chunkCount: parsed.chunkCount,
      exportedAt: parsed.exportedAt,
      durationMs: Date.now() - startedAt,
    })

    return parsed
  }
}
