import {
  DataType,
  ErrorCode,
  MilvusClient,
} from '@zilliz/milvus2-sdk-node'

import { RagMilvusRuntimeConfig } from './config'
import {
  RagVectorChunkPayload,
  RagVectorSearchInput,
  RagVectorSearchMatch,
} from './types'

const CHUNK_ID_FIELD = 'chunk_id'
const DOCUMENT_ID_FIELD = 'document_id'
const SOURCE_TYPE_FIELD = 'source_type'
const SOURCE_SCOPE_FIELD = 'source_scope'
const SOURCE_VERSION_FIELD = 'source_version'
const SECTION_FIELD = 'section'
const CONTENT_FIELD = 'content'
const VECTOR_FIELD = 'embedding'
const METADATA_FIELD = 'metadata_json'

/**
 * Milvus 向量存储 client 端口。
 *
 * 说明：
 * - 适配器只依赖这个端口，避免直接耦合 SDK 细节；
 * - 单测可通过 mock 该端口，避免真实 Milvus 连接成本。
 */
export interface MilvusVectorStoreClient {
  upsertChunks(chunks: RagVectorChunkPayload[]): Promise<void>
  deleteChunksByDocument(documentId: string): Promise<void>
  search(input: RagVectorSearchInput): Promise<RagVectorSearchMatch[]>
}

function escapeMilvusStringLiteral(value: string): string {
  return value.replaceAll('\\', '\\\\').replaceAll('"', '\\"')
}

function buildFilter(input: RagVectorSearchInput): string | undefined {
  const clauses: string[] = []

  if (input.sourceType) {
    clauses.push(`${SOURCE_TYPE_FIELD} == "${escapeMilvusStringLiteral(input.sourceType)}"`)
  }

  if (input.sourceScope) {
    clauses.push(`${SOURCE_SCOPE_FIELD} == "${escapeMilvusStringLiteral(input.sourceScope)}"`)
  }

  return clauses.length > 0 ? clauses.join(' && ') : undefined
}

function resolveStatus(payload: unknown): {
  errorCode?: unknown
  reason?: unknown
} {
  if (!payload || typeof payload !== 'object') {
    return {}
  }

  const record = payload as Record<string, unknown>
  const status =
    record.status && typeof record.status === 'object'
      ? (record.status as Record<string, unknown>)
      : null

  return {
    errorCode: status?.error_code ?? record.error_code,
    reason: status?.reason ?? record.reason,
  }
}

function assertMilvusSuccess(payload: unknown, action: string): void {
  const { errorCode, reason } = resolveStatus(payload)

  if (!errorCode || errorCode === ErrorCode.SUCCESS) {
    return
  }

  throw new Error(
    `Milvus ${action} failed: ${
      typeof reason === 'string' && reason ? reason : String(errorCode)
    }`,
  )
}

function normalizeSearchRows(results: unknown): Record<string, unknown>[] {
  if (!Array.isArray(results)) {
    return []
  }

  if (results.length > 0 && Array.isArray(results[0])) {
    return (results[0] as unknown[]).filter(
      (item): item is Record<string, unknown> =>
        Boolean(item) && typeof item === 'object',
    )
  }

  return results.filter(
    (item): item is Record<string, unknown> =>
      Boolean(item) && typeof item === 'object',
  )
}

/**
 * 基于官方 Milvus SDK 的最小 client 实现。
 */
export class MilvusSdkVectorStoreClient implements MilvusVectorStoreClient {
  private readonly client: MilvusClient
  private collectionReady = false

  constructor(private readonly config: RagMilvusRuntimeConfig) {
    this.client = new MilvusClient({
      address: this.config.address,
      database: this.config.database,
      token: this.config.token,
    })
  }

  async upsertChunks(chunks: RagVectorChunkPayload[]): Promise<void> {
    if (chunks.length === 0) {
      return
    }

    await this.ensureCollectionReady()
    const response = await this.client.upsert({
      collection_name: this.config.collection,
      data: chunks.map((chunk) => ({
        [CHUNK_ID_FIELD]: chunk.id,
        [DOCUMENT_ID_FIELD]: chunk.documentId,
        [SOURCE_TYPE_FIELD]: chunk.sourceType,
        [SOURCE_SCOPE_FIELD]: chunk.sourceScope,
        [SOURCE_VERSION_FIELD]: chunk.sourceVersion,
        [SECTION_FIELD]: chunk.section,
        [CONTENT_FIELD]: chunk.content,
        [VECTOR_FIELD]: chunk.embedding,
        [METADATA_FIELD]: chunk.metadataJson ?? null,
      })),
    })

    assertMilvusSuccess(response, 'upsert')
  }

  async deleteChunksByDocument(documentId: string): Promise<void> {
    await this.ensureCollectionReady()
    const response = await this.client.delete({
      collection_name: this.config.collection,
      filter: `${DOCUMENT_ID_FIELD} == "${escapeMilvusStringLiteral(documentId)}"`,
    })

    assertMilvusSuccess(response, 'delete')
  }

  async search(input: RagVectorSearchInput): Promise<RagVectorSearchMatch[]> {
    await this.ensureCollectionReady()

    const response = await this.client.search({
      collection_name: this.config.collection,
      anns_field: VECTOR_FIELD,
      data: [input.queryVector],
      limit: Math.max(Math.floor(input.limit), 0),
      metric_type: 'COSINE',
      filter: buildFilter(input),
      output_fields: [
        CHUNK_ID_FIELD,
        DOCUMENT_ID_FIELD,
        SOURCE_TYPE_FIELD,
        SOURCE_SCOPE_FIELD,
        SOURCE_VERSION_FIELD,
        SECTION_FIELD,
        CONTENT_FIELD,
        METADATA_FIELD,
      ],
    })

    assertMilvusSuccess(response, 'search')

    const rows = normalizeSearchRows((response as { results?: unknown }).results)

    return rows.map((row) => ({
      id: String(row[CHUNK_ID_FIELD] ?? row.id ?? ''),
      documentId: String(row[DOCUMENT_ID_FIELD] ?? ''),
      sourceType: String(row[SOURCE_TYPE_FIELD] ?? 'user_docs') as RagVectorChunkPayload['sourceType'],
      sourceScope: String(row[SOURCE_SCOPE_FIELD] ?? 'draft') as RagVectorChunkPayload['sourceScope'],
      sourceVersion: String(row[SOURCE_VERSION_FIELD] ?? ''),
      section: String(row[SECTION_FIELD] ?? 'user_docs'),
      content: String(row[CONTENT_FIELD] ?? ''),
      embedding: Array.isArray(row[VECTOR_FIELD]) ? (row[VECTOR_FIELD] as number[]) : [],
      metadataJson:
        row[METADATA_FIELD] && typeof row[METADATA_FIELD] === 'object'
          ? (row[METADATA_FIELD] as Record<string, unknown>)
          : null,
      score: Number(row.score ?? 0),
    }))
  }

  /**
   * 确保 collection 存在、建索引并已加载。
   */
  private async ensureCollectionReady(): Promise<void> {
    if (this.collectionReady) {
      return
    }

    const hasCollectionResponse = await this.client.hasCollection({
      collection_name: this.config.collection,
    })

    assertMilvusSuccess(hasCollectionResponse, 'hasCollection')

    if (!hasCollectionResponse.value) {
      const createCollectionResponse = await this.client.createCollection({
        collection_name: this.config.collection,
        fields: [
          {
            name: CHUNK_ID_FIELD,
            data_type: DataType.VarChar,
            is_primary_key: true,
            autoID: false,
            max_length: 512,
          },
          {
            name: DOCUMENT_ID_FIELD,
            data_type: DataType.VarChar,
            max_length: 512,
          },
          {
            name: SOURCE_TYPE_FIELD,
            data_type: DataType.VarChar,
            max_length: 64,
          },
          {
            name: SOURCE_SCOPE_FIELD,
            data_type: DataType.VarChar,
            max_length: 32,
          },
          {
            name: SOURCE_VERSION_FIELD,
            data_type: DataType.VarChar,
            max_length: 128,
          },
          {
            name: SECTION_FIELD,
            data_type: DataType.VarChar,
            max_length: 128,
          },
          {
            name: CONTENT_FIELD,
            data_type: DataType.VarChar,
            max_length: 8192,
          },
          {
            name: VECTOR_FIELD,
            data_type: DataType.FloatVector,
            dim: this.config.vectorDimension,
          },
          {
            name: METADATA_FIELD,
            data_type: DataType.JSON,
            nullable: true,
          },
        ],
        enable_dynamic_field: true,
      })

      assertMilvusSuccess(createCollectionResponse, 'createCollection')

      const createIndexResponse = await this.client.createIndex({
        collection_name: this.config.collection,
        field_name: VECTOR_FIELD,
        index_name: `${VECTOR_FIELD}_idx`,
        extra_params: {
          index_type: 'AUTOINDEX',
          metric_type: 'COSINE',
        },
      })

      assertMilvusSuccess(createIndexResponse, 'createIndex')
    }

    const loadResponse = await this.client.loadCollectionSync({
      collection_name: this.config.collection,
    })

    assertMilvusSuccess(loadResponse, 'loadCollectionSync')
    this.collectionReady = true
  }
}

/**
 * 构建默认 Milvus SDK client。
 */
export function createMilvusSdkClient(
  config: RagMilvusRuntimeConfig,
): MilvusVectorStoreClient {
  return new MilvusSdkVectorStoreClient(config)
}
