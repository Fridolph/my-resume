import { sqliteTable, text, uniqueIndex, integer } from 'drizzle-orm/sqlite-core'

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull(),
  status: text('status').notNull(),
  sortOrder: integer('sort_order').notNull(),
  cover: text('cover').notNull(),
  externalUrl: text('external_url').notNull(),
  tags: text('tags').notNull(),
  locales: text('locales').notNull(),
  updatedAt: text('updated_at').notNull()
}, table => ({
  slugUnique: uniqueIndex('projects_slug_unique').on(table.slug)
}))

export type ProjectRow = typeof projects.$inferSelect
export type ProjectInsert = typeof projects.$inferInsert
