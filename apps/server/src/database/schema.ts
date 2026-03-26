import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const systemMeta = sqliteTable('system_meta', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: integer('updated_at', {
    mode: 'timestamp_ms',
  }).notNull(),
});
