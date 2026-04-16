import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

import type { StandardResume } from '../modules/resume/domain/standard-resume'

import { STANDARD_RESUME_KEY } from './resume-records'

export const systemMeta = sqliteTable('system_meta', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: integer('updated_at', {
    mode: 'timestamp_ms',
  }).notNull(),
})

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
