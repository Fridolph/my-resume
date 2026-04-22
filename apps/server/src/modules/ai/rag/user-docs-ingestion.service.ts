import { Inject, Injectable } from '@nestjs/common'
import { createHash, randomUUID } from 'node:crypto'

import { RagSourceScope } from '../../../database/schema'
import { AiService } from '../ai.service'
import { FileExtractionService } from '../file-extraction.service'
import { RagRetrievalRepository } from './rag-retrieval.repository'

const DEFAULT_CHUNK_SIZE = 900
const DEFAULT_CHUNK_OVERLAP = 120

export interface IngestUserDocInput {
  buffer: Buffer
  originalname: string
  mimetype: string
  size: number
  sourceScope?: RagSourceScope
  uploadedAt?: Date
}

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

export function buildUserDocSourceVersion(uploadedAt: Date | string): string {
  return `upload:${new Date(uploadedAt).getTime()}`
}

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

function computeContentHash(content: string): string {
  return createHash('sha256').update(content).digest('hex')
}

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
