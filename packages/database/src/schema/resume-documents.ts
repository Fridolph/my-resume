import { sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const resumeDocuments = sqliteTable('resume_documents', {
  id: text('id').primaryKey(),
  status: text('status').notNull(),
  locales: text('locales').notNull(),
  updatedBy: text('updated_by'),
  reviewedBy: text('reviewed_by'),
  publishedAt: text('published_at'),
  updatedAt: text('updated_at').notNull()
})

export type ResumeDocumentRow = typeof resumeDocuments.$inferSelect
export type ResumeDocumentInsert = typeof resumeDocuments.$inferInsert
