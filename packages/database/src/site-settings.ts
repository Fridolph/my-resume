import type { SiteSettingsRecord } from '@repo/types'
import { sqlite } from './client'
import type { SiteSettingsRow } from './schema'

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
    defaultLocale: row.default_locale as SiteSettingsRecord['defaultLocale'],
    socialLinks: JSON.parse(row.social_links),
    downloadLinks: JSON.parse(row.download_links),
    seo: JSON.parse(row.seo),
    updatedAt: row.updated_at
  }
}

function toRow(record: SiteSettingsRecord): SiteSettingsRow {
  return {
    id: record.id,
    default_locale: record.defaultLocale,
    social_links: JSON.stringify(record.socialLinks),
    download_links: JSON.stringify(record.downloadLinks),
    seo: JSON.stringify(record.seo),
    updated_at: record.updatedAt
  }
}

export async function ensureSiteSettingsSeed() {
  const existing = sqlite.prepare('SELECT id FROM site_settings WHERE id = ?').get(defaultSiteSettings.id) as { id: string } | undefined

  if (!existing) {
    const row = toRow(defaultSiteSettings)
    sqlite.prepare(`
      INSERT INTO site_settings (id, default_locale, social_links, download_links, seo, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(row.id, row.default_locale, row.social_links, row.download_links, row.seo, row.updated_at)
  }
}

export async function getSiteSettingsRecord() {
  await ensureSiteSettingsSeed()
  const row = sqlite.prepare(`
    SELECT id, default_locale, social_links, download_links, seo, updated_at
    FROM site_settings
    WHERE id = ?
  `).get(defaultSiteSettings.id) as SiteSettingsRow | undefined

  return fromRow(row ?? toRow(defaultSiteSettings))
}

export async function updateSiteSettingsRecord(record: SiteSettingsRecord) {
  const nextRecord: SiteSettingsRecord = {
    ...record,
    updatedAt: new Date().toISOString()
  }

  const row = toRow(nextRecord)

  await ensureSiteSettingsSeed()
  sqlite.prepare(`
    UPDATE site_settings
    SET default_locale = ?, social_links = ?, download_links = ?, seo = ?, updated_at = ?
    WHERE id = ?
  `).run(row.default_locale, row.social_links, row.download_links, row.seo, row.updated_at, row.id)

  return nextRecord
}
