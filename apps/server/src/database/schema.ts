import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

import { UserRole } from '../modules/auth/domain/user-role.enum'
import type { StandardResume } from '../modules/resume/domain/standard-resume'

import { STANDARD_RESUME_KEY } from './resume-records'

/**
 * users：后台登录用户表。
 *
 * 作用：
 * - 持久化 admin / viewer 等账号身份信息。
 * - 仅保存密码哈希，禁止明文密码落库。
 * - 为后续扩展更多角色与用户状态保留稳定主表。
 */
export const users = sqliteTable(
  'users',
  {
    id: text('id').primaryKey(),
    username: text('username').notNull(),
    passwordHash: text('password_hash').notNull(),
    role: text('role').$type<UserRole>().notNull(),
    isActive: integer('is_active', {
      mode: 'boolean',
    })
      .notNull()
      .$defaultFn(() => true),
    lastLoginAt: integer('last_login_at', {
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
    usernameUnique: uniqueIndex('users_username_unique').on(table.username),
    roleActiveIndex: index('users_role_is_active_idx').on(table.role, table.isActive),
    createdAtIndex: index('users_created_at_idx').on(table.createdAt),
  }),
)

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

export type AiChatVisitorLeadStatus = 'submitted' | 'issued' | 'closed'
export type AiChatUseKeyStatus = 'issued' | 'claimed' | 'revoked' | 'expired'
export type AiChatSessionStatus = 'open' | 'closed'
export type AiChatMessageRole = 'user' | 'assistant' | 'system'

/**
 * ai_chat_visitor_leads：公开站访客线索表。
 *
 * 作用：
 * - 记录公开站访客的姓名/公司、联系方式与留言。
 * - 作为 useKey 发放与会话治理的上游入口。
 */
export const aiChatVisitorLeads = sqliteTable(
  'ai_chat_visitor_leads',
  {
    id: text('id').primaryKey(),
    locale: text('locale').notNull(),
    displayName: text('display_name').notNull(),
    companyName: text('company_name'),
    contact: text('contact'),
    message: text('message').notNull(),
    sourceTag: text('source_tag'),
    sourceKey: text('source_key'),
    metadataJson: text('metadata_json', {
      mode: 'json',
    }).$type<Record<string, unknown> | null>(),
    status: text('status').$type<AiChatVisitorLeadStatus>().notNull(),
    createdAt: integer('created_at', {
      mode: 'timestamp_ms',
    }).notNull(),
    updatedAt: integer('updated_at', {
      mode: 'timestamp_ms',
    }).notNull(),
  },
  (table) => ({
    statusCreatedAtIndex: index('ai_chat_visitor_leads_status_created_at_idx').on(
      table.status,
      table.createdAt,
    ),
    sourceKeyCreatedAtIndex: index('ai_chat_visitor_leads_source_key_created_at_idx').on(
      table.sourceKey,
      table.createdAt,
    ),
  }),
)

/**
 * ai_chat_usekeys：公开站 AI chat 试用码表。
 *
 * 作用：
 * - 管理 useKey 的发放、认领、作废和过期状态。
 * - 绑定 lead 与主会话，保证一个 key 对应一条主会话。
 */
export const aiChatUseKeys = sqliteTable(
  'ai_chat_usekeys',
  {
    id: text('id').primaryKey(),
    useKey: text('use_key').notNull(),
    leadId: text('lead_id')
      .notNull()
      .references(() => aiChatVisitorLeads.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    sessionId: text('session_id'),
    issuedByUserId: text('issued_by_user_id'),
    status: text('status').$type<AiChatUseKeyStatus>().notNull(),
    maxTurns: integer('max_turns').notNull(),
    usedTurns: integer('used_turns').notNull(),
    claimedAt: integer('claimed_at', {
      mode: 'timestamp_ms',
    }),
    revokedAt: integer('revoked_at', {
      mode: 'timestamp_ms',
    }),
    expiresAt: integer('expires_at', {
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
    useKeyUnique: uniqueIndex('ai_chat_usekeys_use_key_unique').on(table.useKey),
    leadStatusCreatedAtIndex: index('ai_chat_usekeys_lead_status_created_at_idx').on(
      table.leadId,
      table.status,
      table.createdAt,
    ),
  }),
)

/**
 * ai_chat_sessions：公开站 AI chat 会话主表。
 *
 * 作用：
 * - 聚合会话状态、轮次、压缩摘要和最终总结。
 * - 供 web 恢复会话与 admin 治理回看。
 */
export const aiChatSessions = sqliteTable(
  'ai_chat_sessions',
  {
    id: text('id').primaryKey(),
    leadId: text('lead_id')
      .notNull()
      .references(() => aiChatVisitorLeads.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    useKeyId: text('use_key_id')
      .notNull()
      .references(() => aiChatUseKeys.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    locale: text('locale').notNull(),
    status: text('status').$type<AiChatSessionStatus>().notNull(),
    turnCount: integer('turn_count').notNull(),
    interimSummary: text('interim_summary'),
    finalSummary: text('final_summary'),
    focusKeywordsJson: text('focus_keywords_json', {
      mode: 'json',
    }).$type<string[] | null>(),
    closedAt: integer('closed_at', {
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
    statusUpdatedAtIndex: index('ai_chat_sessions_status_updated_at_idx').on(
      table.status,
      table.updatedAt,
    ),
    leadCreatedAtIndex: index('ai_chat_sessions_lead_created_at_idx').on(
      table.leadId,
      table.createdAt,
    ),
  }),
)

/**
 * ai_chat_messages：公开站 AI chat 消息明细表。
 *
 * 作用：
 * - 保存用户消息、AI 回答和系统总结消息。
 * - answerBlocks / citations 以 JSON 落库，便于 web/admin 重建展示。
 */
export const aiChatMessages = sqliteTable(
  'ai_chat_messages',
  {
    id: text('id').primaryKey(),
    sessionId: text('session_id')
      .notNull()
      .references(() => aiChatSessions.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    role: text('role').$type<AiChatMessageRole>().notNull(),
    content: text('content').notNull(),
    turnIndex: integer('turn_index').notNull(),
    answerBlocksJson: text('answer_blocks_json', {
      mode: 'json',
    }).$type<unknown | null>(),
    citationsJson: text('citations_json', {
      mode: 'json',
    }).$type<unknown | null>(),
    createdAt: integer('created_at', {
      mode: 'timestamp_ms',
    }).notNull(),
  },
  (table) => ({
    sessionTurnCreatedAtIndex: index('ai_chat_messages_session_turn_created_at_idx').on(
      table.sessionId,
      table.turnIndex,
      table.createdAt,
    ),
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
