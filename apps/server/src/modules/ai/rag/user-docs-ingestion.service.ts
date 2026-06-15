import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { createHash, randomUUID } from 'node:crypto'

import { RagSourceScope } from '../../../database/schema'
import { AiService } from '../ai.service'
import { FileExtractionService } from '../file-extraction.service'
import { RagRetrievalRepository } from './rag-retrieval.repository'
import {
  buildUserDocsKnowledgeMetadata,
  type RagKnowledgeMetadata,
} from './rag-knowledge-domain'
import type { RagRichCardMetadata } from './rag.types'
import { RAG_VECTOR_STORE } from './vector-store/tokens'
import type { RagVectorChunkPayload, RagVectorStore } from './vector-store/types'
import {
  resolveUserDocChunkingConfig,
  splitUserDocByMarkdownSections,
  splitUserDocTextIntoChunks,
  type UserDocChunkingProfile,
} from './user-doc-chunking'

export {
  compareUserDocChunkingStrategies,
  DEFAULT_CHUNK_OVERLAP,
  DEFAULT_CHUNK_SIZE,
  MAX_CHUNK_OVERLAP,
  MAX_CHUNK_SIZE,
  MIN_CHUNK_OVERLAP,
  MIN_CHUNK_SIZE,
  normalizeUserDocText,
  parseOptionalUserDocChunkingNumber,
  resolveUserDocChunkingConfig,
  resolveUserDocChunkingStrategy,
  splitUserDocTextIntoChunks,
  summarizeUserDocChunking,
  USER_DOC_CHUNKING_PROFILE_MAP,
  USER_DOC_CHUNKING_STRATEGIES,
} from './user-doc-chunking'
export type {
  UserDocChunkingProfile,
  ResolveUserDocChunkingConfigInput,
  UserDocChunkingStrategy,
  UserDocChunkingSummary,
} from './user-doc-chunking'

/**
 * 用户资料入库输入。
 */
export interface IngestUserDocInput {
  buffer: Buffer
  originalname: string
  mimetype: string
  size: number
  sourceScope?: RagSourceScope
  title?: string
  chunkingProfile?: UserDocChunkingProfile
  chunkSize?: number
  chunkOverlap?: number
  contentType?: string
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
  chunkingProfile: UserDocChunkingProfile
  chunkSize: number
  chunkOverlap: number
  uploadedAt: string
  vectorStoreBackend: RagVectorStore['backend']
  vectorStoreSynced: boolean
  vectorStoreWarning: string | null
}

export interface IngestCustomInput {
  title: string
  content: string
  contentType?: string
  sourceScope?: RagSourceScope
  linkUrl?: string
  linkUrls?: string[]
  imageUrls?: string[]
  summary?: string
}

export interface ReconcileUserDocsVectorsResult {
  backend: RagVectorStore['backend']
  dbDocumentCount: number
  vectorDocumentCountBefore: number
  deletedOrphans: string[]
  reindexedDocuments: string[]
  warnings: string[]
}

export interface ExportUserDocsResult {
  exportedAt: string
  documentCount: number
  documents: Array<{
    id: string
    title: string
    sourceScope: RagSourceScope
    contentType?: string
    summary?: string
    linkUrl?: string
    linkUrls?: string[]
    imageUrls?: string[]
    content: string
    createdAt: string
    updatedAt: string
  }>
}

export interface ResetUserDocsResult {
  resetAt: string
  deletedDocumentIds: string[]
  deletedVectorDocumentIds: string[]
  backend: RagVectorStore['backend']
}

export interface RagUserDocDetail {
  id: string
  title: string
  sourceType: string
  sourceScope: RagSourceScope
  locale: string
  contentType?: string
  content: string
  linkUrl?: string
  linkUrls?: string[]
  imageUrls?: string[]
  summary?: string
  preview?: string | null
  chunkCount?: number
  editable: boolean
  createdAt: string
  updatedAt: string
}

interface BuildVectorChunksInput {
  chunks: string[]
  embeddings: number[][]
  sourceId: string
  documentId: string
  fileName: string
  sourceScope: RagSourceScope
  sourceVersion: string
  chunkingProfile: UserDocChunkingProfile
  chunkSize: number
  chunkOverlap: number
  knowledgeMetadata: RagKnowledgeMetadata & {
    richCard?: RagRichCardMetadata
  }
  uploadedAt: Date
}

interface StoredUserDocChunkRow {
  chunkId: string
  documentId: string
  chunkIndex: number
  section: string
  content: string
  embeddingJson: number[] | null
  metadataJson: unknown
  documentSourceType: string
  documentSourceScope: RagSourceScope
  documentSourceVersion: string
}

interface EditableCustomMetadataShape extends Record<string, unknown> {
  ingestMode?: string
  rawContent?: string
  rawLinkUrl?: string
  rawLinkUrls?: string[]
  rawImageUrls?: string[]
  articleSummary?: string
  richCard?: RagRichCardMetadata
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

function buildRichCardSummary(content: string): string {
  const normalized = content.replace(/\s+/g, ' ').trim()

  return normalized.length > 180 ? `${normalized.slice(0, 180)}...` : normalized
}

function normalizeStringList(values: readonly unknown[] | undefined): string[] {
  if (!values) return []

  return Array.from(
    new Set(
      values
        .filter((value): value is string => typeof value === 'string')
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  )
}

function normalizeCustomLinkUrls(input: IngestCustomInput): string[] {
  return normalizeStringList([input.linkUrl, ...(input.linkUrls ?? [])])
}

function buildCustomSearchText(content: string, linkUrls: string[]): string {
  return linkUrls.length > 0
    ? `${content}\n\n参考链接：\n${linkUrls.join('\n')}`
    : content
}

function contentTypeCategoryLabel(contentType?: string): string {
  if (contentType === 'hobby') return '兴趣爱好'
  if (contentType === 'knowledge_column') return '知识专栏'
  if (contentType === 'general') return '其他通用'

  return '技术博客'
}

async function resolveCustomSummary(
  aiService: AiService,
  logger: Logger,
  input: IngestCustomInput,
): Promise<string> {
  const manualSummary = input.summary?.trim()
  if (manualSummary) return manualSummary

  try {
    const result = await aiService.generateText({
      systemPrompt: [
        '你是 RAG 资料入库助手。',
        '请为用户提供的资料生成 3 句话以内的中文简介。',
        '只输出简介正文，不要输出标题、编号或 Markdown。',
      ].join('\n'),
      prompt: [
        `标题：${input.title}`,
        `类型：${contentTypeCategoryLabel(input.contentType)}`,
        '正文：',
        input.content.slice(0, 3000),
      ].join('\n\n'),
      maxTokens: 180,
      temperature: 0.2,
    })
    const summary = result.text.replace(/\s+/g, ' ').trim()

    if (summary) return summary
  } catch (error) {
    logger.warn({
      event: 'rag.user_docs.summary_generation_failed',
      title: input.title,
      error: error instanceof Error ? error.message : String(error),
    })
  }

  return buildRichCardSummary(input.content)
}

function buildCustomRichCardMetadata(input: IngestCustomInput & { resolvedSummary: string }): RagRichCardMetadata {
  const linkUrls = normalizeCustomLinkUrls(input)
  const imageUrls = normalizeStringList(input.imageUrls)
  const media = [
    ...linkUrls.slice(1).map((url, index) => ({
      type: 'link' as const,
      url,
      title: `参考链接 ${index + 2}`,
    })),
    ...imageUrls.slice(1).map((url, index) => ({
      type: 'image' as const,
      url,
      thumbnailUrl: url,
      title: `参考图片 ${index + 2}`,
    })),
  ]

  return {
    title: input.title,
    description: input.resolvedSummary,
    summary: input.resolvedSummary,
    url: linkUrls[0],
    urls: linkUrls,
    imageUrl: imageUrls[0],
    imageUrls,
    keywords: [],
    media,
  }
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function normalizeCustomStoredContent(content: string): string {
  return content.replace(/\r\n/g, '\n').trim()
}

function stripTrailingStoredLink(content: string, linkUrl?: string): string {
  if (!isNonEmptyString(linkUrl)) {
    return content.trim()
  }

  const escapedUrl = linkUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return content
    .replace(new RegExp(`\\n{1,2}链接：${escapedUrl}\\s*$`), '')
    .trim()
}

function isEditableCustomMetadata(metadata: unknown): metadata is EditableCustomMetadataShape {
  if (!metadata || typeof metadata !== 'object') {
    return false
  }

  const candidate = metadata as EditableCustomMetadataShape
  return candidate.ingestMode === 'custom' || Boolean(candidate.richCard)
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
  private readonly logger = new Logger(UserDocsIngestionService.name)

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
    const chunkingProfile = input.chunkingProfile ?? 'balanced'
    const chunkingStrategy = resolveUserDocChunkingConfig({
      profile: chunkingProfile,
      chunkSize: input.chunkSize,
      chunkOverlap: input.chunkOverlap,
    })
    const sourceVersion = buildUserDocSourceVersion(uploadedAt)
    const runId = randomUUID()
    const knowledgeMetadata = buildUserDocsKnowledgeMetadata(input.contentType)

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
      const chunks =
        chunkingStrategy.label === 'semantic'
          ? splitUserDocByMarkdownSections(extracted.text)
          : splitUserDocTextIntoChunks(
              extracted.text,
              chunkingStrategy.chunkSize,
              chunkingStrategy.chunkOverlap,
            )
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
        title: input.title ?? extracted.fileName,
        contentHash: computeContentHash(extracted.text),
        metadataJson: {
          sourceType: 'user_docs',
          ...knowledgeMetadata,
          fileName: extracted.fileName,
          fileType: extracted.fileType,
          mimeType: extracted.mimeType,
          contentType: knowledgeMetadata.contentType,
          chunkingProfile,
          chunkSize: chunkingStrategy.chunkSize,
          chunkOverlap: chunkingStrategy.chunkOverlap,
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
            ...knowledgeMetadata,
            chunkingProfile,
            chunkSize: chunkingStrategy.chunkSize,
            chunkOverlap: chunkingStrategy.chunkOverlap,
            uploadedAt: uploadedAt.toISOString(),
            chunkIndex,
            chunkCount: chunks.length,
          },
          createdAt: now,
          updatedAt: now,
        })),
      )
      let vectorStoreSynced = true
      let vectorStoreWarning: string | null = null

      try {
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
            chunkingProfile,
            chunkSize: chunkingStrategy.chunkSize,
            chunkOverlap: chunkingStrategy.chunkOverlap,
            knowledgeMetadata,
            uploadedAt,
          }),
        )
      } catch (error) {
        vectorStoreSynced = false
        vectorStoreWarning =
          error instanceof Error && error.message.trim()
            ? error.message
            : 'Vector store sync skipped because the backend is unavailable.'

        this.logger.warn({
          event: 'rag.user_docs.vector_sync_skipped',
          backend: this.ragVectorStore.backend,
          documentId,
          fileName: extracted.fileName,
          sourceScope,
          sourceVersion,
          warning: vectorStoreWarning,
        })
      }

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
        fileName: input.title ?? extracted.fileName,
        fileType: extracted.fileType,
        chunkingProfile,
        chunkSize: chunkingStrategy.chunkSize,
        chunkOverlap: chunkingStrategy.chunkOverlap,
        uploadedAt: uploadedAt.toISOString(),
        vectorStoreBackend: this.ragVectorStore.backend,
        vectorStoreSynced,
        vectorStoreWarning,
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
        ...input.knowledgeMetadata,
        fileName: input.fileName,
        chunkingProfile: input.chunkingProfile,
        chunkSize: input.chunkSize,
        chunkOverlap: input.chunkOverlap,
        uploadedAt: input.uploadedAt.toISOString(),
        chunkIndex,
        chunkCount: input.chunks.length,
      },
    }))
  }

  private buildVectorChunksFromStoredRows(rows: StoredUserDocChunkRow[]): RagVectorChunkPayload[] {
    return [...rows]
      .sort((left, right) => left.chunkIndex - right.chunkIndex)
      .map((row) => ({
        id: row.chunkId,
        documentId: row.documentId,
        sourceType: 'user_docs',
        sourceScope: row.documentSourceScope,
        sourceVersion: row.documentSourceVersion,
        section: row.section,
        content: row.content,
        embedding: row.embeddingJson ?? [],
        metadataJson:
          row.metadataJson && typeof row.metadataJson === 'object'
            ? (row.metadataJson as Record<string, unknown>)
            : null,
      }))
  }

  private async syncDocumentVectors(
    documentId: string,
    chunks: RagVectorChunkPayload[],
  ): Promise<{ synced: true; warning: null } | { synced: false; warning: string }> {
    try {
      await this.ragVectorStore.deleteChunksByDocument(documentId)
      if (chunks.length > 0) {
        await this.ragVectorStore.upsertChunks(chunks)
      }

      return {
        synced: true,
        warning: null,
      }
    } catch (error) {
      return {
        synced: false,
        warning:
          error instanceof Error && error.message.trim()
            ? error.message
            : 'Vector store sync skipped because the backend is unavailable.',
      }
    }
  }

  async ingestCustom(input: IngestCustomInput): Promise<IngestUserDocResult> {
    const now = new Date()
    const uploadedAt = now
    const normalizedContent = normalizeCustomStoredContent(input.content)
    const linkUrls = normalizeCustomLinkUrls(input)
    const imageUrls = normalizeStringList(input.imageUrls)
    const text = buildCustomSearchText(normalizedContent, linkUrls)
    const chunkingStrategy = resolveUserDocChunkingConfig()

    const chunks =
      chunkingStrategy.label === 'semantic'
        ? splitUserDocByMarkdownSections(text)
        : splitUserDocTextIntoChunks(text, chunkingStrategy.chunkSize, chunkingStrategy.chunkOverlap)

    const sourceId = buildUserDocSourceId(input.title, uploadedAt, text)
    const documentId = `user-doc:${sourceId}:und`
    const sourceScope: RagSourceScope = input.sourceScope ?? 'published'
    const sourceVersion = buildUserDocSourceVersion(uploadedAt)
    const knowledgeMetadata = buildUserDocsKnowledgeMetadata(input.contentType)
    const resolvedSummary = await resolveCustomSummary(this.aiService, this.logger, {
      ...input,
      content: normalizedContent,
    })
    const richCard = buildCustomRichCardMetadata({
      ...input,
      content: normalizedContent,
      linkUrls,
      imageUrls,
      resolvedSummary,
    })
    const chunkingProfile: UserDocChunkingProfile =
      chunkingStrategy.label === 'semantic' ? 'semantic'
        : chunkingStrategy.label === '1000/100' ? 'contextual' : 'balanced'

    const embeddingResult = await this.aiService.embedTexts({ texts: chunks })

    await this.ragRetrievalRepository.upsertDocument({
      id: documentId,
      sourceType: 'user_docs',
      sourceScope,
      sourceId,
      sourceVersion,
      locale: 'und',
      title: input.title,
      contentHash: computeContentHash(text),
      metadataJson: {
        sourceType: 'user_docs',
        ...knowledgeMetadata,
        fileName: `${input.title}.md`,
        fileType: 'md',
        mimeType: 'text/markdown',
        contentType: knowledgeMetadata.contentType,
        ingestMode: 'custom',
        rawContent: normalizedContent,
        rawLinkUrl: linkUrls[0],
        rawLinkUrls: linkUrls,
        rawImageUrls: imageUrls,
        articleSummary: richCard.summary,
        richCard,
        chunkingProfile,
        chunkSize: chunkingStrategy.chunkSize,
        chunkOverlap: chunkingStrategy.chunkOverlap,
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
          fileName: `${input.title}.md`,
          sourceType: 'user_docs',
          ...knowledgeMetadata,
          ingestMode: 'custom',
          rawContent: normalizedContent,
          rawLinkUrl: linkUrls[0],
          rawLinkUrls: linkUrls,
          rawImageUrls: imageUrls,
          articleSummary: richCard.summary,
          richCard,
          chunkingProfile,
          chunkSize: chunkingStrategy.chunkSize,
          chunkOverlap: chunkingStrategy.chunkOverlap,
          uploadedAt: uploadedAt.toISOString(),
          chunkIndex,
          chunkCount: chunks.length,
        },
        createdAt: now,
        updatedAt: now,
      })),
    )

    const vectorSync = await this.syncDocumentVectors(
      documentId,
      this.buildVectorChunks({
        chunks,
        embeddings: embeddingResult.embeddings,
        sourceId,
        documentId,
        fileName: `${input.title}.md`,
        sourceScope,
        sourceVersion,
        chunkingProfile,
        chunkSize: chunkingStrategy.chunkSize,
        chunkOverlap: chunkingStrategy.chunkOverlap,
        knowledgeMetadata: {
          ...knowledgeMetadata,
          richCard,
        },
        uploadedAt,
      }),
    )

    if (!vectorSync.synced) {
      this.logger.warn({
        event: 'rag.user_docs.vector_sync_skipped',
        backend: this.ragVectorStore.backend,
        documentId,
        fileName: `${input.title}.md`,
        sourceScope,
        sourceVersion,
        warning: vectorSync.warning,
      })
    }

    return {
      documentId,
      sourceId,
      sourceScope,
      sourceVersion,
      chunkCount: chunks.length,
      fileName: input.title,
      fileType: 'md',
      chunkingProfile,
      chunkSize: chunkingStrategy.chunkSize,
      chunkOverlap: chunkingStrategy.chunkOverlap,
      uploadedAt: uploadedAt.toISOString(),
      vectorStoreBackend: this.ragVectorStore.backend,
      vectorStoreSynced: vectorSync.synced,
      vectorStoreWarning: vectorSync.warning,
    }
  }

  async listDocuments() {
    const rows = await this.ragRetrievalRepository.listAllDocuments()
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      sourceType: row.sourceType,
      sourceScope: row.sourceScope,
      locale: row.locale,
      contentType: row.metadataJson && typeof row.metadataJson === 'object'
        ? (row.metadataJson as Record<string, unknown>).contentType as string | undefined
        : undefined,
      summary: row.metadataJson && typeof row.metadataJson === 'object'
        ? ((row.metadataJson as Record<string, unknown>).articleSummary as string | undefined)
          ?? (((row.metadataJson as Record<string, unknown>).richCard as Record<string, unknown> | undefined)?.summary as string | undefined)
          ?? (((row.metadataJson as Record<string, unknown>).richCard as Record<string, unknown> | undefined)?.description as string | undefined)
        : undefined,
      chunkCount: 'chunkCount' in row ? (row as any).chunkCount : undefined,
      preview: (row as any).previewContent as string ?? null,
      editable: isEditableCustomMetadata(row.metadataJson),
      createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
      updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt),
    }))
  }

  async getDocumentDetail(documentId: string): Promise<RagUserDocDetail> {
    const document = await this.ragRetrievalRepository.findDocumentById(documentId)

    if (!document) {
      throw new NotFoundException(`RAG document not found: ${documentId}`)
    }

    const chunks = await this.ragRetrievalRepository.listChunksByDocumentId(documentId)
    const metadata =
      document.metadataJson && typeof document.metadataJson === 'object'
        ? (document.metadataJson as EditableCustomMetadataShape)
        : null
    const editable = isEditableCustomMetadata(metadata)
    const preview = chunks[0]?.content ?? null
    const rawLinkUrl =
      Array.isArray(metadata?.rawLinkUrls) && isNonEmptyString(metadata.rawLinkUrls[0]) ? metadata.rawLinkUrls[0]
      : isNonEmptyString(metadata?.rawLinkUrl) ? metadata.rawLinkUrl
      : isNonEmptyString(metadata?.richCard?.url) ? metadata.richCard.url
      : undefined
    const rawLinkUrls =
      Array.isArray(metadata?.rawLinkUrls) ? normalizeStringList(metadata.rawLinkUrls)
      : normalizeStringList([
        metadata?.rawLinkUrl,
        metadata?.richCard?.url,
        ...(((metadata?.richCard as Record<string, unknown> | undefined)?.urls as unknown[] | undefined) ?? []),
      ])
    const rawImageUrls =
      Array.isArray(metadata?.rawImageUrls) ? normalizeStringList(metadata.rawImageUrls)
      : normalizeStringList([
        metadata?.richCard?.imageUrl,
        ...(((metadata?.richCard as Record<string, unknown> | undefined)?.imageUrls as unknown[] | undefined) ?? []),
      ])
    const rawContent =
      isNonEmptyString(metadata?.rawContent) ? metadata.rawContent
      : chunks.map((chunk) => chunk.content).join('\n\n')
    const content = stripTrailingStoredLink(rawContent, rawLinkUrl)
    const summary =
      isNonEmptyString(metadata?.articleSummary) ? metadata.articleSummary
      : isNonEmptyString(metadata?.richCard?.summary) ? metadata.richCard.summary
      : isNonEmptyString(metadata?.richCard?.description) ? metadata.richCard.description
      : undefined

    return {
      id: document.id,
      title: document.title,
      sourceType: document.sourceType,
      sourceScope: document.sourceScope,
      locale: document.locale,
      contentType: isNonEmptyString(metadata?.contentType) ? metadata.contentType : undefined,
      content,
      linkUrl: rawLinkUrl,
      linkUrls: rawLinkUrls,
      imageUrls: rawImageUrls,
      summary,
      preview,
      chunkCount: chunks.length,
      editable,
      createdAt:
        document.createdAt instanceof Date ? document.createdAt.toISOString() : String(document.createdAt),
      updatedAt:
        document.updatedAt instanceof Date ? document.updatedAt.toISOString() : String(document.updatedAt),
    }
  }

  async deleteDocument(documentId: string) {
    await this.ragVectorStore.deleteChunksByDocument(documentId)
    await this.ragRetrievalRepository.deleteDocument(documentId)
    return { deleted: true, documentId }
  }

  async exportUserDocs(): Promise<ExportUserDocsResult> {
    const rows = await this.ragRetrievalRepository.listDocumentsBySourceType('user_docs')
    const documents = []

    for (const row of rows) {
      const detail = await this.getDocumentDetail(row.id)
      documents.push({
        id: detail.id,
        title: detail.title,
        sourceScope: detail.sourceScope,
        contentType: detail.contentType,
        summary: detail.summary,
        linkUrl: detail.linkUrl,
        linkUrls: detail.linkUrls,
        imageUrls: detail.imageUrls,
        content: detail.content,
        createdAt: detail.createdAt,
        updatedAt: detail.updatedAt,
      })
    }

    return {
      exportedAt: new Date().toISOString(),
      documentCount: documents.length,
      documents,
    }
  }

  async resetUserDocs(): Promise<ResetUserDocsResult> {
    if (this.ragVectorStore.backend === 'snapshot') {
      throw new Error('user_docs reset is not supported when backend=snapshot')
    }

    const rows = await this.ragRetrievalRepository.listDocumentsBySourceType('user_docs')
    const deletedVectorDocumentIds: string[] = []

    for (const row of rows) {
      await this.ragVectorStore.deleteChunksByDocument(row.id)
      deletedVectorDocumentIds.push(row.id)
    }

    const deletedDocumentIds = await this.ragRetrievalRepository.deleteDocumentsBySourceType('user_docs')

    return {
      resetAt: new Date().toISOString(),
      deletedDocumentIds,
      deletedVectorDocumentIds,
      backend: this.ragVectorStore.backend,
    }
  }

  async reconcileUserDocsVectors(): Promise<ReconcileUserDocsVectorsResult> {
    if (this.ragVectorStore.backend === 'snapshot') {
      throw new Error('user_docs vector reconcile is not supported when backend=snapshot')
    }

    const documentRows = await this.ragRetrievalRepository.listAllDocuments()
    const userDocs = documentRows.filter((row) => row.sourceType === 'user_docs')
    const allChunkRows = await this.ragRetrievalRepository.listAllChunksWithDocuments()
    const userDocChunkRows = allChunkRows.filter((row) => row.documentSourceType === 'user_docs')
    const dbDocumentIds = new Set(userDocs.map((row) => row.id))
    const vectorDocumentIds = await this.ragVectorStore.listDocumentIds('user_docs')
    const deletedOrphans: string[] = []
    const reindexedDocuments: string[] = []
    const warnings: string[] = []

    for (const documentId of vectorDocumentIds) {
      if (dbDocumentIds.has(documentId)) continue

      const deletion = await this.syncDocumentVectors(documentId, [])
      if (!deletion.synced) {
        throw new Error(`failed to delete orphan vector chunks for ${documentId}: ${deletion.warning}`)
      }

      deletedOrphans.push(documentId)
    }

    for (const document of userDocs) {
      const chunks = this.buildVectorChunksFromStoredRows(
        userDocChunkRows.filter((row) => row.documentId === document.id),
      )
      const sync = await this.syncDocumentVectors(document.id, chunks)

      if (!sync.synced) {
        throw new Error(`failed to reindex ${document.id}: ${sync.warning}`)
      }

      reindexedDocuments.push(document.id)
    }

    if (this.ragVectorStore.backend === 'local') {
      warnings.push('local backend does not persist user_docs vectors; reconcile completed as a no-op.')
    }

    return {
      backend: this.ragVectorStore.backend,
      dbDocumentCount: userDocs.length,
      vectorDocumentCountBefore: vectorDocumentIds.length,
      deletedOrphans,
      reindexedDocuments,
      warnings,
    }
  }

  async updateCustom(documentId: string, input: {
    title?: string
    content?: string
    contentType?: string
    sourceScope?: RagSourceScope
    linkUrl?: string
    linkUrls?: string[]
    imageUrls?: string[]
    summary?: string
  }) {
    const document = await this.ragRetrievalRepository.findDocumentById(documentId)

    if (!document) {
      throw new NotFoundException(`RAG document not found: ${documentId}`)
    }

    const metadata =
      document.metadataJson && typeof document.metadataJson === 'object'
        ? (document.metadataJson as EditableCustomMetadataShape)
        : null

    if (!isEditableCustomMetadata(metadata)) {
      throw new BadRequestException('Only custom user_docs can be edited')
    }

    const detail = await this.getDocumentDetail(documentId)
    const now = new Date()
    const nextTitle = input.title?.trim() || detail.title
    const nextContent = normalizeCustomStoredContent(input.content ?? detail.content)
    const nextLinkUrls =
      typeof input.linkUrls !== 'undefined'
        ? normalizeStringList([input.linkUrl, ...input.linkUrls])
        : normalizeStringList([input.linkUrl, ...(detail.linkUrls ?? [])])
    const effectiveLinkUrls = nextLinkUrls.length > 0 ? nextLinkUrls : normalizeStringList([detail.linkUrl])
    const nextImageUrls =
      typeof input.imageUrls !== 'undefined'
        ? normalizeStringList(input.imageUrls)
        : normalizeStringList(detail.imageUrls)
    const text = buildCustomSearchText(nextContent, effectiveLinkUrls)
    const chunkingProfile =
      metadata.chunkingProfile === 'semantic' ||
      metadata.chunkingProfile === 'contextual' ||
      metadata.chunkingProfile === 'balanced'
        ? metadata.chunkingProfile
        : 'balanced'
    const chunkSize = typeof metadata.chunkSize === 'number' ? metadata.chunkSize : undefined
    const chunkOverlap = typeof metadata.chunkOverlap === 'number' ? metadata.chunkOverlap : undefined
    const chunkingStrategy = resolveUserDocChunkingConfig({
      profile: chunkingProfile,
      chunkSize,
      chunkOverlap,
    })
    const chunks =
      chunkingStrategy.label === 'semantic'
        ? splitUserDocByMarkdownSections(text)
        : splitUserDocTextIntoChunks(text, chunkingStrategy.chunkSize, chunkingStrategy.chunkOverlap)
    const knowledgeMetadata = buildUserDocsKnowledgeMetadata(
      input.contentType ?? (isNonEmptyString(metadata.contentType) ? metadata.contentType : undefined),
    )
    const resolvedSummary = await resolveCustomSummary(this.aiService, this.logger, {
      title: nextTitle,
      content: nextContent,
      contentType: knowledgeMetadata.contentType,
      sourceScope: input.sourceScope ?? document.sourceScope,
      linkUrls: effectiveLinkUrls,
      imageUrls: nextImageUrls,
      summary: input.summary,
    })
    const richCard = buildCustomRichCardMetadata({
      title: nextTitle,
      content: nextContent,
      contentType: knowledgeMetadata.contentType,
      sourceScope: input.sourceScope ?? document.sourceScope,
      linkUrls: effectiveLinkUrls,
      imageUrls: nextImageUrls,
      summary: resolvedSummary,
      resolvedSummary,
    })
    const embeddingResult = await this.aiService.embedTexts({ texts: chunks })
    const nextSourceVersion = buildUserDocSourceVersion(now)
    const storedMetadata: EditableCustomMetadataShape = {
      ...(metadata ?? {}),
      sourceType: 'user_docs',
      ...knowledgeMetadata,
      fileName: `${nextTitle}.md`,
      fileType: 'md',
      mimeType: 'text/markdown',
      contentType: knowledgeMetadata.contentType,
      ingestMode: 'custom',
      rawContent: nextContent,
      rawLinkUrl: effectiveLinkUrls[0],
      rawLinkUrls: effectiveLinkUrls,
      rawImageUrls: nextImageUrls,
      articleSummary: richCard.summary,
      richCard,
      chunkingProfile,
      chunkSize: chunkingStrategy.chunkSize,
      chunkOverlap: chunkingStrategy.chunkOverlap,
      uploadedAt:
        isNonEmptyString(metadata?.uploadedAt) ? metadata.uploadedAt : now.toISOString(),
    }

    await this.ragRetrievalRepository.updateDocumentById({
      id: documentId,
      sourceScope: input.sourceScope ?? document.sourceScope,
      sourceVersion: nextSourceVersion,
      title: nextTitle,
      contentHash: computeContentHash(text),
      metadataJson: storedMetadata,
      updatedAt: now,
    })

    await this.ragRetrievalRepository.replaceChunksForDocument(
      documentId,
      chunks.map((chunk, chunkIndex) => ({
        id: `${documentId}:chunk:${chunkIndex + 1}`,
        documentId,
        chunkIndex,
        section: 'user_docs',
        content: chunk,
        contentHash: computeContentHash(chunk),
        embeddingJson: embeddingResult.embeddings[chunkIndex] ?? [],
        metadataJson: {
          ...storedMetadata,
          chunkIndex,
          chunkCount: chunks.length,
        },
        createdAt: now,
        updatedAt: now,
      })),
    )

    const vectorSync = await this.syncDocumentVectors(
      documentId,
      this.buildVectorChunks({
        chunks,
        embeddings: embeddingResult.embeddings,
        sourceId: document.sourceId,
        documentId,
        fileName: `${nextTitle}.md`,
        sourceScope: input.sourceScope ?? document.sourceScope,
        sourceVersion: nextSourceVersion,
        chunkingProfile,
        chunkSize: chunkingStrategy.chunkSize,
        chunkOverlap: chunkingStrategy.chunkOverlap,
        knowledgeMetadata: {
          ...knowledgeMetadata,
          richCard,
        },
        uploadedAt: isNonEmptyString(metadata?.uploadedAt) ? new Date(metadata.uploadedAt) : now,
      }),
    )

    return {
      updated: true,
      documentId,
      chunkCount: chunks.length,
      vectorStoreBackend: this.ragVectorStore.backend,
      vectorStoreSynced: vectorSync.synced,
      vectorStoreWarning: vectorSync.warning,
    }
  }
}
