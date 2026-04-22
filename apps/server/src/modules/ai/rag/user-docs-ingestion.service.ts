import { Inject, Injectable } from '@nestjs/common'
import { createHash, randomUUID } from 'node:crypto'

import { RagSourceScope } from '../../../database/schema'
import { AiService } from '../ai.service'
import { FileExtractionService } from '../file-extraction.service'
import { RagRetrievalRepository } from './rag-retrieval.repository'

/**
 * user_docs 默认切块大小（字符）。
 *
 * 说明：
 * - 相比 resume_core，user_docs（博客/笔记）文本跨度更大，过大的 chunk 会稀释检索精度。
 * - 这里取 500，优先保证召回粒度与可解释性。
 */
const DEFAULT_CHUNK_SIZE = 500

/**
 * user_docs 默认切块重叠长度（字符）。
 *
 * 说明：
 * - overlap 用于减少语义断裂；
 * - 过大会带来冗余，过小会丢失上下文衔接。
 * - 这里取 50，作为教学场景下的折中默认值。
 */
const DEFAULT_CHUNK_OVERLAP = 50

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
 * 将提取后的文本按固定窗口切块，并保留 overlap。
 *
 * @param text 原始文本
 * @param chunkSize 每块最大字符数
 * @param chunkOverlap 相邻块重叠字符数
 * @returns 切分后的 chunk 文本列表
 */
export function splitUserDocTextIntoChunks(
  text: string,
  chunkSize = DEFAULT_CHUNK_SIZE,
  chunkOverlap = DEFAULT_CHUNK_OVERLAP,
): string[] {
  const normalizedText = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()

  if (!normalizedText) {
    return []
  }

  const safeChunkSize = Math.max(Math.floor(chunkSize), 1)
  const safeChunkOverlap = Math.min(Math.max(Math.floor(chunkOverlap), 0), safeChunkSize - 1)
  const step = safeChunkSize - safeChunkOverlap
  const chunks: string[] = []

  for (let start = 0; start < normalizedText.length; start += step) {
    const chunk = normalizedText.slice(start, start + safeChunkSize).trim()

    if (chunk) {
      chunks.push(chunk)
    }

    if (start + safeChunkSize >= normalizedText.length) {
      break
    }
  }

  return chunks
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
}
