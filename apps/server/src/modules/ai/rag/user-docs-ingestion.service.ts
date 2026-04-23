import { Inject, Injectable } from '@nestjs/common'
import { createHash, randomUUID } from 'node:crypto'

import { RagSourceScope } from '../../../database/schema'
import { AiService } from '../ai.service'
import { FileExtractionService } from '../file-extraction.service'
import { RagRetrievalRepository } from './rag-retrieval.repository'
import { RAG_VECTOR_STORE } from './rag-vector-store.tokens'
import type { RagVectorChunkPayload, RagVectorStore } from './rag-vector-store.types'
import { splitUserDocTextIntoChunks } from './user-doc-chunking'

export {
  compareUserDocChunkingStrategies,
  DEFAULT_CHUNK_OVERLAP,
  DEFAULT_CHUNK_SIZE,
  normalizeUserDocText,
  splitUserDocTextIntoChunks,
  summarizeUserDocChunking,
  USER_DOC_CHUNKING_STRATEGIES,
} from './user-doc-chunking'
export type { UserDocChunkingStrategy, UserDocChunkingSummary } from './user-doc-chunking'

/**
 * 用户资料入库输入。
 */
export interface IngestUserDocInput {
  buffer: Buffer
  originalname: string
  mimetype: string
  size: number
  sourceScope?: RagSourceScope
  uploadedAt?: Date
}

/**
 * 用户资料入库结果摘要。
 */
export interface IngestUserDocResult {
  documentId: string
  sourceId: string
  sourceScope: RagSourceScope
  sourceVersion: string
  chunkCount: number
  fileName: string
  fileType: 'txt' | 'md' | 'pdf' | 'docx'
  uploadedAt: string
}

interface BuildVectorChunksInput {
  chunks: string[]
  embeddings: number[][]
  sourceId: string
  documentId: string
  fileName: string
  sourceScope: RagSourceScope
  sourceVersion: string
  uploadedAt: Date
}

/**
 * 构建 user_docs 的 sourceVersion。
 *
 * 规则：`upload:<timestamp_ms>`
 *
 * @param uploadedAt 上传时间
 * @returns 稳定版本键
 */
export function buildUserDocSourceVersion(uploadedAt: Date | string): string {
  return `upload:${new Date(uploadedAt).getTime()}`
}

/**
 * 计算内容哈希，用于去重与追踪。
 *
 * @param content 文本内容
 * @returns sha256 哈希
 */
function computeContentHash(content: string): string {
  return createHash('sha256').update(content).digest('hex')
}

/**
 * 构建 user_docs sourceId。
 *
 * 说明：
 * - 使用 `文件名 + 上传时间 + 文本长度` 的指纹生成稳定短键；
 * - 用于 document 与 chunk 的来源关联。
 *
 * @param fileName 文件名
 * @param uploadedAt 上传时间
 * @param text 提取文本
 * @returns 来源 ID
 */
function buildUserDocSourceId(fileName: string, uploadedAt: Date, text: string): string {
  return createHash('sha256')
    .update(`${fileName}:${uploadedAt.toISOString()}:${text.length}`)
    .digest('hex')
    .slice(0, 24)
}

@Injectable()
export class UserDocsIngestionService {
  constructor(
    @Inject(FileExtractionService)
    private readonly fileExtractionService: FileExtractionService,
    @Inject(AiService)
    private readonly aiService: AiService,
    @Inject(RagRetrievalRepository)
    private readonly ragRetrievalRepository: RagRetrievalRepository,
    @Inject(RAG_VECTOR_STORE)
    private readonly ragVectorStore: RagVectorStore,
  ) {}

  /**
   * 复用现有文件提取链路，将用户资料写入检索态表。
   *
   * @param input 上传文件输入
   * @returns 入库结果摘要
   */
  async ingest(input: IngestUserDocInput): Promise<IngestUserDocResult> {
    const startedAt = new Date()
    const uploadedAt = input.uploadedAt ?? startedAt
    const sourceScope = input.sourceScope ?? 'draft'
    const sourceVersion = buildUserDocSourceVersion(uploadedAt)
    const runId = randomUUID()

    await this.ragRetrievalRepository.createIndexRun({
      id: runId,
      sourceType: 'user_docs',
      sourceScope,
      sourceVersion,
      status: 'pending',
      chunkCount: 0,
      startedAt,
      createdAt: startedAt,
      updatedAt: startedAt,
    })

    try {
      const extracted = await this.fileExtractionService.extractText({
        buffer: input.buffer,
        originalname: input.originalname,
        mimetype: input.mimetype,
        size: input.size,
      })
      const chunks = splitUserDocTextIntoChunks(extracted.text)
      const sourceId = buildUserDocSourceId(extracted.fileName, uploadedAt, extracted.text)
      const documentId = `user-doc:${sourceId}:und`
      const now = new Date()

      const embeddingResult = await this.aiService.embedTexts({
        texts: chunks,
      })

      await this.ragRetrievalRepository.upsertDocument({
        id: documentId,
        sourceType: 'user_docs',
        sourceScope,
        sourceId,
        sourceVersion,
        locale: 'und',
        title: extracted.fileName,
        contentHash: computeContentHash(extracted.text),
        metadataJson: {
          sourceType: 'user_docs',
          fileName: extracted.fileName,
          fileType: extracted.fileType,
          mimeType: extracted.mimeType,
          uploadedAt: uploadedAt.toISOString(),
        },
        createdAt: now,
        updatedAt: now,
      })

      await this.ragRetrievalRepository.replaceChunksForDocument(
        documentId,
        chunks.map((chunk, chunkIndex) => ({
          id: `user-doc-chunk:${sourceId}:${chunkIndex + 1}`,
          documentId,
          chunkIndex,
          section: 'user_docs',
          content: chunk,
          contentHash: computeContentHash(chunk),
          embeddingJson: embeddingResult.embeddings[chunkIndex] ?? [],
          metadataJson: {
            fileName: extracted.fileName,
            sourceType: 'user_docs',
            uploadedAt: uploadedAt.toISOString(),
            chunkIndex,
            chunkCount: chunks.length,
          },
          createdAt: now,
          updatedAt: now,
        })),
      )
      await this.ragVectorStore.deleteChunksByDocument(documentId)
      await this.ragVectorStore.upsertChunks(
        this.buildVectorChunks({
          chunks,
          embeddings: embeddingResult.embeddings,
          sourceId,
          documentId,
          fileName: extracted.fileName,
          sourceScope,
          sourceVersion,
          uploadedAt,
        }),
      )

      await this.ragRetrievalRepository.updateIndexRunStatus({
        id: runId,
        status: 'succeeded',
        chunkCount: chunks.length,
        errorMessage: null,
        finishedAt: new Date(),
        updatedAt: new Date(),
      })

      return {
        documentId,
        sourceId,
        sourceScope,
        sourceVersion,
        chunkCount: chunks.length,
        fileName: extracted.fileName,
        fileType: extracted.fileType,
        uploadedAt: uploadedAt.toISOString(),
      }
    } catch (error) {
      await this.ragRetrievalRepository.updateIndexRunStatus({
        id: runId,
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'User docs ingestion failed',
        finishedAt: new Date(),
        updatedAt: new Date(),
      })

      throw error
    }
  }

  /**
   * 将入库切块转换为向量存储统一载荷。
   *
   * @param input 组装向量块所需输入
   * @returns 向量存储层可消费的 chunk 列表
   */
  private buildVectorChunks(input: BuildVectorChunksInput): RagVectorChunkPayload[] {
    return input.chunks.map((chunk, chunkIndex) => ({
      id: `user-doc-chunk:${input.sourceId}:${chunkIndex + 1}`,
      documentId: input.documentId,
      sourceType: 'user_docs',
      sourceScope: input.sourceScope,
      sourceVersion: input.sourceVersion,
      section: 'user_docs',
      content: chunk,
      embedding: input.embeddings[chunkIndex] ?? [],
      metadataJson: {
        sourceType: 'user_docs',
        fileName: input.fileName,
        uploadedAt: input.uploadedAt.toISOString(),
        chunkIndex,
        chunkCount: input.chunks.length,
      },
    }))
  }
}
