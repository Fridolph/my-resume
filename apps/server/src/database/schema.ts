import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

import type { StandardResume } from '../modules/resume/domain/standard-resume'

import { STANDARD_RESUME_KEY } from './resume-records'

/**
 * system_meta：系统级键值元信息表。
 *
 * 作用：
 * - 存储轻量级运行时元信息（如初始化标记、版本戳等）。
 * - 不承载业务核心数据。
 */
export const systemMeta = sqliteTable('system_meta', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: integer('updated_at', {
    mode: 'timestamp_ms',
  }).notNull(),
})

/**
 * resume_drafts：当前草稿位。
 *
 * 作用：
 * - 只保存“当前可编辑草稿”的最新状态。
 * - 通过固定 resume_key 做单槽位 upsert。
 */
export const resumeDrafts = sqliteTable('resume_drafts', {
  resumeKey: text('resume_key')
    .primaryKey()
    .$defaultFn(() => STANDARD_RESUME_KEY),
  schemaVersion: integer('schema_version').notNull(),
  resumeJson: text('resume_json', {
    mode: 'json',
  })
    .$type<StandardResume>()
    .notNull(),
  updatedAt: integer('updated_at', {
    mode: 'timestamp_ms',
  }).notNull(),
})

/**
 * resume_publication_snapshots：发布快照表（append-only）。
 *
 * 作用：
 * - 每次发布都追加一条不可变快照。
 * - 与草稿态分离，保证公开展示可追溯。
 */
export const resumePublicationSnapshots = sqliteTable(
  'resume_publication_snapshots',
  {
    id: text('id').primaryKey(),
    resumeKey: text('resume_key').notNull(),
    schemaVersion: integer('schema_version').notNull(),
    resumeJson: text('resume_json', {
      mode: 'json',
    })
      .$type<StandardResume>()
      .notNull(),
    publishedAt: integer('published_at', {
      mode: 'timestamp_ms',
    }).notNull(),
  },
  (table) => ({
    resumeKeyPublishedAtIndex: index(
      'resume_publication_snapshots_resume_key_published_at_idx',
    ).on(table.resumeKey, table.publishedAt),
  }),
)

/**
 * ai_usage_records：AI 调用审计表。
 *
 * 作用：
 * - 记录 AI 分析/优化等调用的输入摘要、状态、耗时与关联记录。
 * - 支撑后续运营排查、成本分析与结果追踪。
 */
export const aiUsageRecords = sqliteTable(
  'ai_usage_records',
  {
    id: text('id').primaryKey(),
    operationType: text('operation_type').notNull(),
    scenario: text('scenario').notNull(),
    locale: text('locale').notNull(),
    inputPreview: text('input_preview').notNull(),
    summary: text('summary'),
    provider: text('provider').notNull(),
    model: text('model').notNull(),
    mode: text('mode').notNull(),
    generator: text('generator').notNull(),
    status: text('status').notNull(),
    relatedReportId: text('related_report_id'),
    relatedResultId: text('related_result_id'),
    detailJson: text('detail_json', {
      mode: 'json',
    }).$type<unknown | null>(),
    errorMessage: text('error_message'),
    durationMs: integer('duration_ms').notNull(),
    createdAt: integer('created_at', {
      mode: 'timestamp_ms',
    }).notNull(),
  },
  (table) => ({
    operationTypeCreatedAtIndex: index('ai_usage_records_operation_type_created_at_idx').on(
      table.operationType,
      table.createdAt,
    ),
    createdAtIndex: index('ai_usage_records_created_at_idx').on(table.createdAt),
  }),
)

/**
 * RAG 知识源大类：
 * - resume_core: 简历核心事实（优先级最高）
 * - user_docs: 用户补充资料（博客、文章、兴趣内容等）
 */
export type RagSourceType = 'resume_core' | 'user_docs'

/**
 * RAG 知识源作用域：
 * - draft: 草稿态（编辑中的最新内容）
 * - published: 发布态（对外稳定内容）
 */
export type RagSourceScope = 'draft' | 'published'

/**
 * RAG 索引运行状态：
 * - pending: 任务已创建，等待或正在执行
 * - succeeded: 索引成功
 * - failed: 索引失败
 */
export type RagIndexRunStatus = 'pending' | 'succeeded' | 'failed'

/**
 * rag_documents：检索态文档主表
 *
 * 这张表与 resume_drafts / resume_publication_snapshots 分离：
 * - 前者服务“编辑/展示”
 * - 本表服务“检索/过滤/版本追踪”
 */
export const ragDocuments = sqliteTable(
  'rag_documents',
  {
    id: text('id').primaryKey(),
    sourceType: text('source_type').$type<RagSourceType>().notNull(),
    sourceScope: text('source_scope').$type<RagSourceScope>().notNull(),
    sourceId: text('source_id').notNull(),
    sourceVersion: text('source_version').notNull(),
    locale: text('locale').notNull(),
    title: text('title').notNull(),
    contentHash: text('content_hash').notNull(),
    metadataJson: text('metadata_json', {
      mode: 'json',
    }).$type<Record<string, unknown> | null>(),
    createdAt: integer('created_at', {
      mode: 'timestamp_ms',
    }).notNull(),
    updatedAt: integer('updated_at', {
      mode: 'timestamp_ms',
    }).notNull(),
  },
  (table) => ({
    sourceIdentityUnique: uniqueIndex('rag_documents_source_identity_unique').on(
      table.sourceType,
      table.sourceScope,
      table.sourceId,
      table.sourceVersion,
      table.locale,
    ),
    sourceTypeScopeLocaleIndex: index('rag_documents_source_type_scope_locale_idx').on(
      table.sourceType,
      table.sourceScope,
      table.locale,
    ),
    updatedAtIndex: index('rag_documents_updated_at_idx').on(table.updatedAt),
  }),
)

/**
 * rag_chunks：检索态 chunk 表
 *
 * embedding 先落 JSON，保证 SQLite 最小可运行；
 * 后续可平滑迁移到专用向量数据库。
 */
export const ragChunks = sqliteTable(
  'rag_chunks',
  {
    id: text('id').primaryKey(),
    documentId: text('document_id')
      .notNull()
      .references(() => ragDocuments.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    chunkIndex: integer('chunk_index').notNull(),
    section: text('section').notNull(),
    content: text('content').notNull(),
    contentHash: text('content_hash').notNull(),
    embeddingJson: text('embedding_json', {
      mode: 'json',
    })
      .$type<number[]>()
      .notNull(),
    metadataJson: text('metadata_json', {
      mode: 'json',
    }).$type<Record<string, unknown> | null>(),
    createdAt: integer('created_at', {
      mode: 'timestamp_ms',
    }).notNull(),
    updatedAt: integer('updated_at', {
      mode: 'timestamp_ms',
    }).notNull(),
  },
  (table) => ({
    documentChunkIndexUnique: uniqueIndex('rag_chunks_document_chunk_index_unique').on(
      table.documentId,
      table.chunkIndex,
    ),
    documentIdIndex: index('rag_chunks_document_id_idx').on(table.documentId),
    sectionIndex: index('rag_chunks_section_idx').on(table.section),
  }),
)

/**
 * rag_index_runs：索引运行记录表
 *
 * 用于追踪每次索引任务状态，后续可直接扩展重试策略与审计视图。
 */
export const ragIndexRuns = sqliteTable(
  'rag_index_runs',
  {
    id: text('id').primaryKey(),
    sourceType: text('source_type').$type<RagSourceType>().notNull(),
    sourceScope: text('source_scope').$type<RagSourceScope>().notNull(),
    sourceVersion: text('source_version').notNull(),
    status: text('status').$type<RagIndexRunStatus>().notNull(),
    chunkCount: integer('chunk_count').notNull(),
    errorMessage: text('error_message'),
    startedAt: integer('started_at', {
      mode: 'timestamp_ms',
    }).notNull(),
    finishedAt: integer('finished_at', {
      mode: 'timestamp_ms',
    }),
    createdAt: integer('created_at', {
      mode: 'timestamp_ms',
    }).notNull(),
    updatedAt: integer('updated_at', {
      mode: 'timestamp_ms',
    }).notNull(),
  },
  (table) => ({
    sourceVersionCreatedAtIndex: index('rag_index_runs_source_version_created_at_idx').on(
      table.sourceType,
      table.sourceScope,
      table.sourceVersion,
      table.createdAt,
    ),
    statusCreatedAtIndex: index('rag_index_runs_status_created_at_idx').on(
      table.status,
      table.createdAt,
    ),
  }),
)
