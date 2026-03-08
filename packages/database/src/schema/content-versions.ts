import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const contentVersions = sqliteTable('content_versions', {
  id: text('id').primaryKey(),
  moduleType: text('module_type').notNull(),
  entityId: text('entity_id').notNull(),
  version: integer('version').notNull(),
  status: text('status').notNull(),
  changeType: text('change_type').notNull(),
  snapshot: text('snapshot').notNull(),
  createdBy: text('created_by'),
  createdAt: text('created_at').notNull()
}, (table) => ({
  contentVersionEntityVersionUnique: uniqueIndex('content_versions_entity_version_unique').on(table.moduleType, table.entityId, table.version)
}))

export type ContentVersionRow = typeof contentVersions.$inferSelect
export type ContentVersionInsert = typeof contentVersions.$inferInsert
