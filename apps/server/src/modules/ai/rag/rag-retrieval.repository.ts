import { Inject, Injectable } from '@nestjs/common'
import { and, desc, eq } from 'drizzle-orm'

import type { DatabaseInstance } from '../../../database/database.client'
import { DATABASE_INSTANCE } from '../../../database/database.tokens'
import {
  RagIndexRunStatus,
  RagSourceScope,
  RagSourceType,
  ragChunks,
  ragDocuments,
  ragIndexRuns,
} from '../../../database/schema'

export interface UpsertRagDocumentInput {
  id: string
  sourceType: RagSourceType
  sourceScope: RagSourceScope
  sourceId: string
  sourceVersion: string
  locale: string
  title: string
  contentHash: string
  metadataJson?: Record<string, unknown> | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateRagChunkInput {
  id: string
  documentId: string
  chunkIndex: number
  section: string
  content: string
  contentHash: string
  embeddingJson: number[]
  metadataJson?: Record<string, unknown> | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateRagIndexRunInput {
  id: string
  sourceType: RagSourceType
  sourceScope: RagSourceScope
  sourceVersion: string
  status: RagIndexRunStatus
  chunkCount: number
  errorMessage?: string | null
  startedAt: Date
  finishedAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface UpdateRagIndexRunStatusInput {
  id: string
  status: RagIndexRunStatus
  chunkCount?: number
  errorMessage?: string | null
  finishedAt?: Date | null
  updatedAt: Date
}

export interface UpdateRagDocumentByIdInput {
  id: string
  sourceScope?: RagSourceScope
  sourceVersion?: string
  title?: string
  contentHash?: string
  metadataJson?: Record<string, unknown> | null
  updatedAt: Date
}

@Injectable()
export class RagRetrievalRepository {
  constructor(
    @Inject(DATABASE_INSTANCE)
    private readonly database: DatabaseInstance,
  ) {}

  /**
   * 按 source 唯一键写入或覆盖文档记录。
   *
   * 这样可以确保“同一个 source 版本”在检索侧只有一条文档主记录，
   * 避免重复索引导致检索命中噪音。
   *
   * @param input 文档主记录
   * @returns 最新文档记录
   */
  async upsertDocument(input: UpsertRagDocumentInput) {
    await this.database
      .insert(ragDocuments)
      .values({
        ...input,
        metadataJson: input.metadataJson ?? null,
      })
      .onConflictDoUpdate({
        target: [
          ragDocuments.sourceType,
          ragDocuments.sourceScope,
          ragDocuments.sourceId,
          ragDocuments.sourceVersion,
          ragDocuments.locale,
        ],
        set: {
          id: input.id,
          title: input.title,
          contentHash: input.contentHash,
          metadataJson: input.metadataJson ?? null,
          updatedAt: input.updatedAt,
        },
      })

    return this.findDocumentBySourceIdentity({
      sourceType: input.sourceType,
      sourceScope: input.sourceScope,
      sourceId: input.sourceId,
      sourceVersion: input.sourceVersion,
      locale: input.locale,
    })
  }

  /**
   * 按主键读取文档记录。
   *
   * @param id 文档 ID
   * @returns 文档记录或 null
   */
  async findDocumentById(id: string) {
    const [record] = await this.database
      .select()
      .from(ragDocuments)
      .where(eq(ragDocuments.id, id))
      .limit(1)

    return record ?? null
  }

  /**
   * 按 source 唯一键读取文档记录。
   *
   * @param input source 唯一键
   * @returns 文档记录或 null
   */
  async findDocumentBySourceIdentity(input: {
    sourceType: RagSourceType
    sourceScope: RagSourceScope
    sourceId: string
    sourceVersion: string
    locale: string
  }) {
    const [record] = await this.database
      .select()
      .from(ragDocuments)
      .where(
        and(
          eq(ragDocuments.sourceType, input.sourceType),
          eq(ragDocuments.sourceScope, input.sourceScope),
          eq(ragDocuments.sourceId, input.sourceId),
          eq(ragDocuments.sourceVersion, input.sourceVersion),
          eq(ragDocuments.locale, input.locale),
        ),
      )
      .limit(1)

    return record ?? null
  }

  /**
   * 覆盖指定 document 的全部 chunk。
   *
   * 采用“先删后写”保证 chunkIndex 序列与 sourceVersion 对齐，
   * 避免旧 chunk 残留导致检索结果混入历史内容。
   *
   * @param documentId 文档 ID
   * @param chunks 新的 chunk 列表
   */
  async replaceChunksForDocument(documentId: string, chunks: CreateRagChunkInput[]) {
    await this.database.transaction(async (transaction) => {
      await transaction.delete(ragChunks).where(eq(ragChunks.documentId, documentId))

      if (chunks.length === 0) {
        return
      }

      await transaction.insert(ragChunks).values(
        chunks.map((item) => ({
          ...item,
          metadataJson: item.metadataJson ?? null,
        })),
      )
    })
  }

  /**
   * 追加写入一条索引运行记录。
   *
   * @param input 索引运行记录
   * @returns 新写入记录
   */
  async createIndexRun(input: CreateRagIndexRunInput) {
    await this.database.insert(ragIndexRuns).values({
      ...input,
      errorMessage: input.errorMessage ?? null,
      finishedAt: input.finishedAt ?? null,
    })

    return this.findIndexRunById(input.id)
  }

  /**
   * 更新索引运行状态与收敛字段。
   *
   * @param input 状态更新参数
   * @returns 更新后的记录或 null
   */
  async updateIndexRunStatus(input: UpdateRagIndexRunStatusInput) {
    const updateData: {
      status: RagIndexRunStatus
      chunkCount?: number
      errorMessage?: string | null
      finishedAt?: Date | null
      updatedAt: Date
    } = {
      status: input.status,
      updatedAt: input.updatedAt,
    }

    if (typeof input.chunkCount === 'number') {
      updateData.chunkCount = input.chunkCount
    }

    if (typeof input.errorMessage !== 'undefined') {
      updateData.errorMessage = input.errorMessage ?? null
    }

    if (typeof input.finishedAt !== 'undefined') {
      updateData.finishedAt = input.finishedAt ?? null
    }

    await this.database
      .update(ragIndexRuns)
      .set(updateData)
      .where(eq(ragIndexRuns.id, input.id))

    return this.findIndexRunById(input.id)
  }

  /**
   * 按主键读取索引运行记录。
   *
   * @param id 运行记录 ID
   * @returns 索引运行记录或 null
   */
  async findIndexRunById(id: string) {
    const [record] = await this.database
      .select()
      .from(ragIndexRuns)
      .where(eq(ragIndexRuns.id, id))
      .limit(1)

    return record ?? null
  }

  /**
   * 查询最近的索引运行记录。
   *
   * @param limit 返回数量上限
   * @returns 最近运行记录列表
   */
  async listLatestIndexRuns(limit = 20) {
    return this.database
      .select()
      .from(ragIndexRuns)
      .orderBy(desc(ragIndexRuns.createdAt))
      .limit(limit)
  }

  /**
   * 查询所有 chunk（不限 source_type）及其关联文档信息。
   *
   * 替代原先仅查 user_docs 的 listUserDocChunksWithDocuments，
   * 让本地搜索覆盖 resume_core、user_docs 等全部来源。
   *
   * @returns chunk 列表（含文档级元数据，按 chunkIndex 排序）
   */
  async listAllChunksWithDocuments() {
    return this.database
      .select({
        chunkId: ragChunks.id,
        documentId: ragChunks.documentId,
        chunkIndex: ragChunks.chunkIndex,
        section: ragChunks.section,
        content: ragChunks.content,
        embeddingJson: ragChunks.embeddingJson,
        metadataJson: ragChunks.metadataJson,
        documentMetadataJson: ragDocuments.metadataJson,
        documentSourceType: ragDocuments.sourceType,
        documentSourceScope: ragDocuments.sourceScope,
        documentTitle: ragDocuments.title,
        documentSourceVersion: ragDocuments.sourceVersion,
      })
      .from(ragChunks)
      .innerJoin(ragDocuments, eq(ragChunks.documentId, ragDocuments.id))
      .orderBy(ragChunks.chunkIndex)
  }

  /**
   * @deprecated 使用 listAllChunksWithDocuments 代替，后者覆盖全部 source_type
   */
  async listUserDocChunksWithDocuments() {
    return this.listAllChunksWithDocuments()
  }

  async listAllDocuments() {
    const rows = await this.database
      .select()
      .from(ragDocuments)
      .orderBy(desc(ragDocuments.createdAt))

    // 为每个文档加载第一个 chunk 作为预览
    const result = []
    for (const row of rows) {
      const [firstChunk] = await this.database
        .select({ content: ragChunks.content })
        .from(ragChunks)
        .where(eq(ragChunks.documentId, row.id))
        .orderBy(ragChunks.chunkIndex)
        .limit(1)

      result.push({ ...row, previewContent: firstChunk?.content ?? null })
    }

    return result
  }

  async listChunksByDocumentId(documentId: string) {
    return this.database
      .select({
        chunkId: ragChunks.id,
        documentId: ragChunks.documentId,
        chunkIndex: ragChunks.chunkIndex,
        section: ragChunks.section,
        content: ragChunks.content,
        embeddingJson: ragChunks.embeddingJson,
        metadataJson: ragChunks.metadataJson,
        documentMetadataJson: ragDocuments.metadataJson,
        documentSourceType: ragDocuments.sourceType,
        documentSourceScope: ragDocuments.sourceScope,
        documentTitle: ragDocuments.title,
        documentSourceVersion: ragDocuments.sourceVersion,
      })
      .from(ragChunks)
      .innerJoin(ragDocuments, eq(ragChunks.documentId, ragDocuments.id))
      .where(eq(ragChunks.documentId, documentId))
      .orderBy(ragChunks.chunkIndex)
  }

  async listDocumentsBySourceType(sourceType: RagSourceType) {
    return this.database
      .select()
      .from(ragDocuments)
      .where(eq(ragDocuments.sourceType, sourceType))
      .orderBy(desc(ragDocuments.createdAt))
  }

  async deleteDocumentsBySourceType(sourceType: RagSourceType) {
    const rows = await this.database
      .select({ id: ragDocuments.id })
      .from(ragDocuments)
      .where(eq(ragDocuments.sourceType, sourceType))

    await this.database.transaction(async (transaction) => {
      for (const row of rows) {
        await transaction.delete(ragChunks).where(eq(ragChunks.documentId, row.id))
      }

      await transaction.delete(ragDocuments).where(eq(ragDocuments.sourceType, sourceType))
    })

    return rows.map((row) => row.id)
  }

  async updateDocumentById(input: UpdateRagDocumentByIdInput) {
    const updateData: {
      sourceScope?: RagSourceScope
      sourceVersion?: string
      title?: string
      contentHash?: string
      metadataJson?: Record<string, unknown> | null
      updatedAt: Date
    } = {
      updatedAt: input.updatedAt,
    }

    if (typeof input.sourceScope !== 'undefined') {
      updateData.sourceScope = input.sourceScope
    }

    if (typeof input.sourceVersion !== 'undefined') {
      updateData.sourceVersion = input.sourceVersion
    }

    if (typeof input.title !== 'undefined') {
      updateData.title = input.title
    }

    if (typeof input.contentHash !== 'undefined') {
      updateData.contentHash = input.contentHash
    }

    if (typeof input.metadataJson !== 'undefined') {
      updateData.metadataJson = input.metadataJson ?? null
    }

    await this.database
      .update(ragDocuments)
      .set(updateData)
      .where(eq(ragDocuments.id, input.id))

    return this.findDocumentById(input.id)
  }

  async deleteDocument(documentId: string) {
    await this.database.delete(ragChunks).where(eq(ragChunks.documentId, documentId))
    await this.database.delete(ragDocuments).where(eq(ragDocuments.id, documentId))
    return { deleted: true, documentId }
  }
}
