import { sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const siteSettings = sqliteTable('site_settings', {
  id: text('id').primaryKey(),
  defaultLocale: text('default_locale').notNull(),
  socialLinks: text('social_links').notNull(),
  downloadLinks: text('download_links').notNull(),
  seo: text('seo').notNull(),
  updatedAt: text('updated_at').notNull()
})

export type SiteSettingsRow = typeof siteSettings.$inferSelect
export type SiteSettingsInsert = typeof siteSettings.$inferInsert
