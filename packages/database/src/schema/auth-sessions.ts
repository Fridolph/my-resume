import { sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const authSessions = sqliteTable('auth_sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').notNull()
})

export type AuthSessionRow = typeof authSessions.$inferSelect
export type AuthSessionInsert = typeof authSessions.$inferInsert
