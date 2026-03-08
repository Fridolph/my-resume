import { sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const contentReleases = sqliteTable('content_releases', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  status: text('status').notNull(),
  resumeVersionId: text('resume_version_id').notNull(),
  translationVersionIds: text('translation_version_ids').notNull(),
  projectVersionIds: text('project_version_ids').notNull(),
  createdBy: text('created_by'),
  activatedBy: text('activated_by'),
  activatedAt: text('activated_at'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull()
})

export type ContentReleaseRow = typeof contentReleases.$inferSelect
export type ContentReleaseInsert = typeof contentReleases.$inferInsert
