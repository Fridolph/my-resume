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
}
