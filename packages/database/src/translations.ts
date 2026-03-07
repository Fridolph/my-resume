import type { PublishStatus, TranslationNamespace, TranslationRecord, WebLocale } from '@repo/types'
import { asc, eq } from 'drizzle-orm'
import { db } from './client.js'
import type { TranslationInsert, TranslationRow } from './schema/index.js'
import { translations } from './schema/index.js'

const initialTranslations: TranslationRecord[] = [
  {
    id: 'tr_1',
    namespace: 'common',
    key: 'nav.home',
    locale: 'zh-CN',
    value: '首页',
    status: 'published',
    missing: false,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'tr_2',
    namespace: 'common',
    key: 'nav.home',
    locale: 'en-US',
    value: 'Home',
    status: 'published',
    missing: false,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'tr_3',
    namespace: 'resume',
    key: 'resume.hero.title',
    locale: 'zh-CN',
    value: '在线简历',
    status: 'draft',
    missing: false,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'tr_4',
    namespace: 'resume',
    key: 'resume.hero.title',
    locale: 'en-US',
    value: '',
    status: 'draft',
    missing: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'tr_5',
    namespace: 'project',
    key: 'project.list.title',
    locale: 'zh-CN',
    value: '项目列表',
    status: 'published',
    missing: false,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'tr_6',
    namespace: 'seo',
    key: 'home.description',
    locale: 'en-US',
    value: 'Personal content platform homepage',
    status: 'reviewing',
    missing: false,
    updatedAt: new Date().toISOString()
  }
]

function fromRow(row: TranslationRow): TranslationRecord {
  return {
    id: row.id,
    namespace: row.namespace as TranslationNamespace,
    key: row.key,
    locale: row.locale,
    value: row.value,
    status: row.status as PublishStatus,
    missing: Boolean(row.missing),
    updatedAt: row.updatedAt
  }
}

function toRow(record: TranslationRecord): TranslationInsert {
  return {
    id: record.id,
    namespace: record.namespace,
    key: record.key,
    locale: record.locale,
    value: record.value,
    status: record.status,
    missing: record.missing,
    updatedAt: record.updatedAt
  }
}

export async function ensureTranslationsSeed() {
  const existing = await db.select({ id: translations.id }).from(translations).limit(1)

  if (existing.length === 0) {
    await db.insert(translations).values(initialTranslations.map(toRow))
  }
}

export async function listTranslations() {
  await ensureTranslationsSeed()
  const rows = await db.select().from(translations).orderBy(asc(translations.updatedAt), asc(translations.key))
  return rows.map(fromRow)
}

export async function updateTranslation(
  translationId: string,
  record: Omit<TranslationRecord, 'updatedAt' | 'id'>
) {
  const nextRecord: TranslationRecord = {
    id: translationId,
    namespace: record.namespace,
    key: record.key,
    locale: record.locale as WebLocale,
    value: record.value.trim(),
    status: record.status,
    missing: record.value.trim().length === 0,
    updatedAt: new Date().toISOString()
  }

  await db.update(translations)
    .set(toRow(nextRecord))
    .where(eq(translations.id, translationId))

  return nextRecord
}
