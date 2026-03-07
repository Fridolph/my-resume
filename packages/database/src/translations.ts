import type { PublishStatus, TranslationNamespace, TranslationRecord, WebLocale } from '@repo/types'
import { asc, eq } from 'drizzle-orm'
import { db } from './client.js'
import type { TranslationInsert, TranslationRow } from './schema/index.js'
import { translations } from './schema/index.js'

function createTranslation(input: {
  id: string
  namespace: TranslationNamespace
  key: string
  locale: WebLocale
  value: string
  status?: PublishStatus
  missing?: boolean
}): TranslationRecord {
  return {
    ...input,
    status: input.status ?? 'published',
    missing: input.missing ?? input.value.trim().length === 0,
    updatedAt: new Date().toISOString()
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
  createTranslation({ id: 'tr_footer_desc_en', namespace: 'common', key: 'footer.description', locale: 'en-US', value: 'The public site now starts consuming real backend-managed content.' }),
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
  createTranslation({ id: 'tr_home_stat_source_hint_zh', namespace: 'common', key: 'home.stats.source.hint', locale: 'zh-CN', value: '首页数据正在逐步切换到 API Server。' }),
  createTranslation({ id: 'tr_home_stat_source_hint_en', namespace: 'common', key: 'home.stats.source.hint', locale: 'en-US', value: 'Homepage content is being migrated to the API Server.' }),
  createTranslation({ id: 'tr_home_feature_resume_title_zh', namespace: 'common', key: 'home.features.resume.title', locale: 'zh-CN', value: '在线简历' }),
  createTranslation({ id: 'tr_home_feature_resume_title_en', namespace: 'common', key: 'home.features.resume.title', locale: 'en-US', value: 'Resume' }),
  createTranslation({ id: 'tr_home_feature_resume_desc_zh', namespace: 'common', key: 'home.features.resume.description', locale: 'zh-CN', value: '前台简历页已读取后台真实简历文档。' }),
  createTranslation({ id: 'tr_home_feature_resume_desc_en', namespace: 'common', key: 'home.features.resume.description', locale: 'en-US', value: 'The public resume page now reads the real admin resume document.' }),
  createTranslation({ id: 'tr_home_feature_projects_title_zh', namespace: 'common', key: 'home.features.projects.title', locale: 'zh-CN', value: '项目列表' }),
  createTranslation({ id: 'tr_home_feature_projects_title_en', namespace: 'common', key: 'home.features.projects.title', locale: 'en-US', value: 'Projects' }),
  createTranslation({ id: 'tr_home_feature_projects_desc_zh', namespace: 'common', key: 'home.features.projects.description', locale: 'zh-CN', value: '公开项目列表与详情页已切换到后台项目数据。' }),
  createTranslation({ id: 'tr_home_feature_projects_desc_en', namespace: 'common', key: 'home.features.projects.description', locale: 'en-US', value: 'Public project list and detail pages now use real admin project data.' }),
  createTranslation({ id: 'tr_home_feature_i18n_title_zh', namespace: 'common', key: 'home.features.i18n.title', locale: 'zh-CN', value: '公开文案' }),
  createTranslation({ id: 'tr_home_feature_i18n_title_en', namespace: 'common', key: 'home.features.i18n.title', locale: 'en-US', value: 'Public Copy' }),
  createTranslation({ id: 'tr_home_feature_i18n_desc_zh', namespace: 'common', key: 'home.features.i18n.description', locale: 'zh-CN', value: '站点公开文案开始支持后台翻译结果覆盖。' }),
  createTranslation({ id: 'tr_home_feature_i18n_desc_en', namespace: 'common', key: 'home.features.i18n.description', locale: 'en-US', value: 'Public-facing copy now supports overrides from admin-managed translations.' }),
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
  for (const record of initialTranslations) {
    await db.insert(translations)
      .values(toRow(record))
      .onConflictDoNothing()
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
