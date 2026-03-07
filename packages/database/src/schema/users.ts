import { sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  role: text('role').notNull(),
  status: text('status').notNull(),
  permissions: text('permissions').notNull(),
  passwordHash: text('password_hash').notNull(),
  updatedAt: text('updated_at').notNull()
})

export type UserRow = typeof users.$inferSelect
export type UserInsert = typeof users.$inferInsert
