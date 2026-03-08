import type { TranslationNamespace, TranslationRecord, UserSession, WebLocale } from '@repo/types'
import { asc, eq } from 'drizzle-orm'
import { db } from './client.js'
import { createSystemActor, resolveContentAuditFields } from './content-audit.js'
import { createContentVersionSnapshot, ensureSeedContentVersionSnapshot } from './content-versions.js'
import type { TranslationInsert, TranslationRow } from './schema/index.js'
import { translations } from './schema/index.js'

function createTranslation(input: {
  id: string
  namespace: TranslationNamespace
  key: string
  locale: WebLocale
  value: string
  status?: TranslationRecord['status']
  missing?: boolean
}): TranslationRecord {
  const updatedAt = new Date().toISOString()
  const systemActor = createSystemActor()

  return {
    ...input,
    status: input.status ?? 'published',
    missing: input.missing ?? input.value.trim().length === 0,
    updatedBy: systemActor,
    reviewedBy: (input.status ?? 'published') === 'published' ? systemActor : null,
    publishedAt: (input.status ?? 'published') === 'published' ? updatedAt : null,
    updatedAt
  }
}

const initialTranslations: TranslationRecord[] = [
  createTranslation({ id: 'tr_nav_home_zh', namespace: 'common', key: 'nav.home', locale: 'zh-CN', value: '首页' }),
  createTranslation({ id: 'tr_nav_home_en', namespace: 'common', key: 'nav.home', locale: 'en-US', value: 'Home' }),
  createTranslation({ id: 'tr_nav_resume_zh', namespace: 'common', key: 'nav.resume', locale: 'zh-CN', value: '简历' }),
  createTranslation({ id: 'tr_nav_resume_en', namespace: 'common', key: 'nav.resume', locale: 'en-US', value: 'Resume' }),
  createTranslation({ id: 'tr_nav_projects_zh', namespace: 'common', key: 'nav.projects', locale: 'zh-CN', value: '项目' }),
  createTranslation({ id: 'tr_nav_projects_en', namespace: 'common', key: 'nav.projects', locale: 'en-US', value: 'Projects' }),
  createTranslation({ id: 'tr_footer_milestone_zh', namespace: 'common', key: 'footer.milestone', locale: 'zh-CN', value: 'Web milestone P4 · Public Content Integration' }),
  createTranslation({ id: 'tr_footer_milestone_en', namespace: 'common', key: 'footer.milestone', locale: 'en-US', value: 'Web milestone P4 · Public Content Integration' }),
  createTranslation({ id: 'tr_footer_desc_zh', namespace: 'common', key: 'footer.description', locale: 'zh-CN', value: '当前阶段已让公开站点开始消费后台真实内容。' }),
  createTranslation({ id: 'tr_footer_desc_en', namespace: 'common', key: 'footer.description', locale: 'en-US', value: 'The public site now starts consuming backend-managed content.' }),
  createTranslation({ id: 'tr_page_home_desc_zh', namespace: 'seo', key: 'page.home.description', locale: 'zh-CN', value: '首页已开始接入后台公开内容与翻译结果。' }),
  createTranslation({ id: 'tr_page_home_desc_en', namespace: 'seo', key: 'page.home.description', locale: 'en-US', value: 'The homepage now starts consuming backend-managed public content and translations.' }),
  createTranslation({ id: 'tr_home_badge_zh', namespace: 'common', key: 'home.intro.badge', locale: 'zh-CN', value: 'Public Content API' }),
  createTranslation({ id: 'tr_home_badge_en', namespace: 'common', key: 'home.intro.badge', locale: 'en-US', value: 'Public Content API' }),
  createTranslation({ id: 'tr_home_title_zh', namespace: 'common', key: 'home.intro.title', locale: 'zh-CN', value: 'Fridolph Web' }),
  createTranslation({ id: 'tr_home_title_en', namespace: 'common', key: 'home.intro.title', locale: 'en-US', value: 'Fridolph Web' }),
  createTranslation({ id: 'tr_home_desc_zh', namespace: 'common', key: 'home.intro.description', locale: 'zh-CN', value: '首页已开始消费后台真实内容，公开站点与管理后台正在逐步打通。' }),
  createTranslation({ id: 'tr_home_desc_en', namespace: 'common', key: 'home.intro.description', locale: 'en-US', value: 'The homepage now begins to consume real backend content, gradually connecting the public site with the admin system.' }),
  createTranslation({ id: 'tr_home_stat_projects_label_zh', namespace: 'common', key: 'home.stats.projects.label', locale: 'zh-CN', value: '已发布项目' }),
  createTranslation({ id: 'tr_home_stat_projects_label_en', namespace: 'common', key: 'home.stats.projects.label', locale: 'en-US', value: 'Published Projects' }),
  createTranslation({ id: 'tr_home_stat_projects_hint_zh', namespace: 'common', key: 'home.stats.projects.hint', locale: 'zh-CN', value: '仅统计后台已发布项目。' }),
  createTranslation({ id: 'tr_home_stat_projects_hint_en', namespace: 'common', key: 'home.stats.projects.hint', locale: 'en-US', value: 'Only published admin projects are counted.' }),
  createTranslation({ id: 'tr_home_stat_locales_label_zh', namespace: 'common', key: 'home.stats.locales.label', locale: 'zh-CN', value: '公开语言' }),
  createTranslation({ id: 'tr_home_stat_locales_label_en', namespace: 'common', key: 'home.stats.locales.label', locale: 'en-US', value: 'Public Locales' }),
  createTranslation({ id: 'tr_home_stat_locales_hint_zh', namespace: 'common', key: 'home.stats.locales.hint', locale: 'zh-CN', value: '当前公开站点支持的语言数量。' }),
  createTranslation({ id: 'tr_home_stat_locales_hint_en', namespace: 'common', key: 'home.stats.locales.hint', locale: 'en-US', value: 'Number of locales currently available on the public site.' }),
  createTranslation({ id: 'tr_home_stat_source_label_zh', namespace: 'common', key: 'home.stats.source.label', locale: 'zh-CN', value: '内容来源' }),
  createTranslation({ id: 'tr_home_stat_source_label_en', namespace: 'common', key: 'home.stats.source.label', locale: 'en-US', value: 'Content Source' }),
  createTranslation({ id: 'tr_home_stat_source_hint_zh', namespace: 'common', key: 'home.stats.source.hint', locale: 'zh-CN', value: '当前站点内容来自 API Server 与 SQLite。' }),
  createTranslation({ id: 'tr_home_stat_source_hint_en', namespace: 'common', key: 'home.stats.source.hint', locale: 'en-US', value: 'Current site content is served by the API server and SQLite.' }),
  createTranslation({ id: 'tr_home_feature_resume_title_zh', namespace: 'common', key: 'home.features.resume.title', locale: 'zh-CN', value: '在线简历' }),
  createTranslation({ id: 'tr_home_feature_resume_title_en', namespace: 'common', key: 'home.features.resume.title', locale: 'en-US', value: 'Resume' }),
  createTranslation({ id: 'tr_home_feature_resume_desc_zh', namespace: 'common', key: 'home.features.resume.description', locale: 'zh-CN', value: '通过结构化简历文档渲染公开简历页面。' }),
  createTranslation({ id: 'tr_home_feature_resume_desc_en', namespace: 'common', key: 'home.features.resume.description', locale: 'en-US', value: 'Render the public resume page from a structured resume document.' }),
  createTranslation({ id: 'tr_home_feature_projects_title_zh', namespace: 'common', key: 'home.features.projects.title', locale: 'zh-CN', value: '项目列表' }),
  createTranslation({ id: 'tr_home_feature_projects_title_en', namespace: 'common', key: 'home.features.projects.title', locale: 'en-US', value: 'Projects' }),
  createTranslation({ id: 'tr_home_feature_projects_desc_zh', namespace: 'common', key: 'home.features.projects.description', locale: 'zh-CN', value: '通过后台项目管理结果驱动公开项目列表。' }),
  createTranslation({ id: 'tr_home_feature_projects_desc_en', namespace: 'common', key: 'home.features.projects.description', locale: 'en-US', value: 'Drive the public projects list from admin-managed project records.' }),
  createTranslation({ id: 'tr_home_feature_i18n_title_zh', namespace: 'common', key: 'home.features.i18n.title', locale: 'zh-CN', value: '多语言内容' }),
  createTranslation({ id: 'tr_home_feature_i18n_title_en', namespace: 'common', key: 'home.features.i18n.title', locale: 'en-US', value: 'Localized Content' }),
  createTranslation({ id: 'tr_home_feature_i18n_desc_zh', namespace: 'common', key: 'home.features.i18n.description', locale: 'zh-CN', value: '公开站点开始消费后台管理的多语言翻译内容。' }),
  createTranslation({ id: 'tr_home_feature_i18n_desc_en', namespace: 'common', key: 'home.features.i18n.description', locale: 'en-US', value: 'Public-facing copy now supports overrides from admin-managed translations.' }),
  createTranslation({ id: 'tr_resume_badge_zh', namespace: 'resume', key: 'resume.hero.badge', locale: 'zh-CN', value: '结构化简历' }),
  createTranslation({ id: 'tr_resume_badge_en', namespace: 'resume', key: 'resume.hero.badge', locale: 'en-US', value: 'Structured Resume' }),
  createTranslation({ id: 'tr_legacy_resume_title_zh', namespace: 'resume', key: 'resume.hero.title', locale: 'zh-CN', value: '在线简历', status: 'published' }),
  createTranslation({ id: 'tr_legacy_resume_title_en', namespace: 'resume', key: 'resume.hero.title', locale: 'en-US', value: 'Online Resume', status: 'published' }),
  createTranslation({ id: 'tr_project_list_title_zh', namespace: 'project', key: 'project.list.title', locale: 'zh-CN', value: '项目列表', status: 'published' }),
  createTranslation({ id: 'tr_home_description_en', namespace: 'seo', key: 'home.description', locale: 'en-US', value: 'Personal content platform homepage', status: 'published' })
]

function fromRow(row: TranslationRow): TranslationRecord {
  return {
    id: row.id,
    namespace: row.namespace as TranslationNamespace,
    key: row.key,
    locale: row.locale,
    value: row.value,
    status: row.status as TranslationRecord['status'],
    missing: row.missing,
    updatedBy: row.updatedBy ? JSON.parse(row.updatedBy) : null,
    reviewedBy: row.reviewedBy ? JSON.parse(row.reviewedBy) : null,
    publishedAt: row.publishedAt ?? null,
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
    updatedBy: record.updatedBy ? JSON.stringify(record.updatedBy) : null,
    reviewedBy: record.reviewedBy ? JSON.stringify(record.reviewedBy) : null,
    publishedAt: record.publishedAt,
    updatedAt: record.updatedAt
  }
}

export async function ensureTranslationsSeed() {
  for (const record of initialTranslations) {
    await db.insert(translations)
      .values(toRow(record))
      .onConflictDoNothing()

    await ensureSeedContentVersionSnapshot({
      moduleType: 'translation',
      entityId: record.id,
      status: record.status,
      snapshot: record,
      createdBy: record.updatedBy,
      createdAt: record.updatedAt
    })
  }
}

export async function listTranslations() {
  await ensureTranslationsSeed()
  const rows = await db.select().from(translations).orderBy(asc(translations.updatedAt), asc(translations.key))
  const translationList = rows.map(fromRow)

  for (const record of translationList) {
    await ensureSeedContentVersionSnapshot({
      moduleType: 'translation',
      entityId: record.id,
      status: record.status,
      snapshot: record,
      createdBy: record.updatedBy,
      createdAt: record.updatedAt
    })
  }

  return translationList
}

export async function updateTranslation(
  translationId: string,
  record: Omit<TranslationRecord, 'updatedAt' | 'id' | 'missing' | 'updatedBy' | 'reviewedBy' | 'publishedAt'>,
  actor: Pick<UserSession, 'id' | 'name' | 'email'>
) {
  const currentRecord = (await listTranslations()).find(item => item.id === translationId)

  if (!currentRecord) {
    throw new Error('Translation not found')
  }

  const timestamp = new Date().toISOString()
  const audit = resolveContentAuditFields({
    currentStatus: currentRecord.status,
    nextStatus: record.status,
    currentPublishedAt: currentRecord.publishedAt,
    currentUpdatedBy: currentRecord.updatedBy,
    currentReviewedBy: currentRecord.reviewedBy,
    actor,
    timestamp
  })

  const nextRecord: TranslationRecord = {
    id: translationId,
    namespace: record.namespace,
    key: record.key,
    locale: record.locale as WebLocale,
    value: record.value.trim(),
    status: record.status,
    missing: record.value.trim().length === 0,
    updatedBy: audit.updatedBy,
    reviewedBy: audit.reviewedBy,
    publishedAt: audit.publishedAt,
    updatedAt: timestamp
  }

  await db.update(translations)
    .set(toRow(nextRecord))
    .where(eq(translations.id, translationId))

  await createContentVersionSnapshot({
    moduleType: 'translation',
    entityId: nextRecord.id,
    status: nextRecord.status,
    changeType: 'update',
    snapshot: nextRecord,
    createdBy: nextRecord.updatedBy,
    createdAt: nextRecord.updatedAt
  })

  return nextRecord
}
