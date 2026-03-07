import type { SiteSettingsRecord } from '@repo/types'
import { eq } from 'drizzle-orm'
import { db } from './client.js'
import type { SiteSettingsInsert, SiteSettingsRow } from './schema/index.js'
import { siteSettings } from './schema/index.js'

const defaultSiteSettings: SiteSettingsRecord = {
  id: 'site_settings_main',
  defaultLocale: 'zh-CN',
  socialLinks: [
    {
      id: 'social_github',
      label: 'GitHub',
      url: 'https://github.com/Fridolph'
    },
    {
      id: 'social_x',
      label: 'X / Twitter',
      url: 'https://x.com/fridolph'
    }
  ],
  downloadLinks: [
    {
      id: 'download_resume_zh',
      label: '中文简历 PDF',
      url: 'https://fridolph.com/downloads/resume-zh.pdf'
    },
    {
      id: 'download_resume_en',
      label: 'English Resume PDF',
      url: 'https://fridolph.com/downloads/resume-en.pdf'
    }
  ],
  seo: {
    title: 'Fridolph Web',
    description: '个人内容展示站，承载主页、简历、项目与多语言内容。',
    ogImage: 'https://fridolph.com/og-default.svg',
    siteUrl: 'https://fridolph.com'
  },
  updatedAt: new Date().toISOString()
}

function fromRow(row: SiteSettingsRow): SiteSettingsRecord {
  return {
    id: row.id,
    defaultLocale: row.defaultLocale as SiteSettingsRecord['defaultLocale'],
    socialLinks: JSON.parse(row.socialLinks),
    downloadLinks: JSON.parse(row.downloadLinks),
    seo: JSON.parse(row.seo),
    updatedAt: row.updatedAt
  }
}

function toRow(record: SiteSettingsRecord): SiteSettingsInsert {
  return {
    id: record.id,
    defaultLocale: record.defaultLocale,
    socialLinks: JSON.stringify(record.socialLinks),
    downloadLinks: JSON.stringify(record.downloadLinks),
    seo: JSON.stringify(record.seo),
    updatedAt: record.updatedAt
  }
}

export async function ensureSiteSettingsSeed() {
  const existing = await db.select({ id: siteSettings.id })
    .from(siteSettings)
    .where(eq(siteSettings.id, defaultSiteSettings.id))
    .limit(1)

  if (existing.length === 0) {
    await db.insert(siteSettings).values(toRow(defaultSiteSettings))
  }
}

export async function getSiteSettingsRecord() {
  await ensureSiteSettingsSeed()

  const [record] = await db.select()
    .from(siteSettings)
    .where(eq(siteSettings.id, defaultSiteSettings.id))
    .limit(1)

  return record ? fromRow(record) : defaultSiteSettings
}

export async function updateSiteSettingsRecord(record: SiteSettingsRecord) {
  const nextRecord: SiteSettingsRecord = {
    ...record,
    updatedAt: new Date().toISOString()
  }

  const row = toRow(nextRecord)

  await db.insert(siteSettings)
    .values(row)
    .onConflictDoUpdate({
      target: siteSettings.id,
      set: {
        defaultLocale: row.defaultLocale,
        socialLinks: row.socialLinks,
        downloadLinks: row.downloadLinks,
        seo: row.seo,
        updatedAt: row.updatedAt
      }
    })

  return nextRecord
}
