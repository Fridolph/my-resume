import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull(),
  status: text('status').notNull(),
  sortOrder: integer('sort_order').notNull(),
  cover: text('cover').notNull(),
  externalUrl: text('external_url').notNull(),
  tags: text('tags').notNull(),
  locales: text('locales').notNull(),
  updatedBy: text('updated_by'),
  reviewedBy: text('reviewed_by'),
  publishedAt: text('published_at'),
  updatedAt: text('updated_at').notNull()
}, (table) => ({
  projectSlugUnique: uniqueIndex('projects_slug_unique').on(table.slug)
}))

export type ProjectRow = typeof projects.$inferSelect
export type ProjectInsert = typeof projects.$inferInsert
