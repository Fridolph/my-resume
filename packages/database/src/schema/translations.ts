import { int, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const translations = sqliteTable('translations', {
  id: text('id').primaryKey(),
  namespace: text('namespace').notNull(),
  key: text('key').notNull(),
  locale: text('locale').notNull(),
  value: text('value').notNull(),
  status: text('status').notNull(),
  missing: int('missing', { mode: 'boolean' }).notNull(),
  updatedBy: text('updated_by'),
  reviewedBy: text('reviewed_by'),
  publishedAt: text('published_at'),
  updatedAt: text('updated_at').notNull()
}, (table) => ({
  translationUniqueKey: uniqueIndex('translations_namespace_key_locale_unique').on(table.namespace, table.key, table.locale)
}))

export type TranslationRow = typeof translations.$inferSelect
export type TranslationInsert = typeof translations.$inferInsert
