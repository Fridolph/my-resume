import type { RequestPolicy } from './client.types'

/**
 * 简历语言
 */
export type ResumeLocale = 'zh' | 'en'

/**
 * 导出格式
 */
export type ResumeExportFormat = 'markdown' | 'pdf'

/**
 * 双语文本
 */
export interface LocalizedText {
  zh: string
  en: string
}

/**
 * 简历元信息
 */
export interface ResumeMeta {
  slug: 'standard-resume'
  version: 1
  defaultLocale: ResumeLocale
  locales: ResumeLocale[]
}

/**
 * 个人链接
 */
export interface ResumeProfileLink {
  label: LocalizedText
  url: string
  icon?: string
}

/**
 * 兴趣项
 */
export interface ResumeProfileInterestItem {
  label: LocalizedText
  icon?: string
}

/**
 * 主视觉信息
 */
export interface ResumeProfileHero {
  frontImageUrl: string
  backImageUrl: string
  linkUrl: string
  slogans: LocalizedText[]
}

/**
 * 个人资料
 */
export interface ResumeProfile {
  fullName: LocalizedText
  headline: LocalizedText
  summary: LocalizedText
  location: LocalizedText
  email: string
  phone: string
  website: string
  hero: ResumeProfileHero
  links: ResumeProfileLink[]
  interests: ResumeProfileInterestItem[]
}

/**
 * 教育经历
 */
export interface ResumeEducationItem {
  schoolName: LocalizedText
  degree: LocalizedText
  fieldOfStudy: LocalizedText
  startDate: string
  endDate: string
  location: LocalizedText
  highlights: LocalizedText[]
}

/**
 * 工作经历
 */
export interface ResumeExperienceItem {
  companyName: LocalizedText
  role: LocalizedText
  employmentType: LocalizedText
  startDate: string
  endDate: string
  location: LocalizedText
  summary: LocalizedText
  highlights: LocalizedText[]
  technologies: string[]
}

/**
 * 项目经历
 */
export interface ResumeProjectItem {
  name: LocalizedText
  role: LocalizedText
  startDate: string
  endDate: string
  summary: LocalizedText
  coreFunctions: LocalizedText
  highlights: LocalizedText[]
  technologies: string[]
  links: ResumeProfileLink[]
}

/**
 * 技能组
 */
export interface ResumeSkillGroup {
  name: LocalizedText
  keywords: string[]
}

/**
 * 简历亮点
 */
export interface ResumeHighlightItem {
  title: LocalizedText
  description: LocalizedText
}

/**
 * 标准简历模型
 */
export interface StandardResume {
  meta: ResumeMeta
  profile: ResumeProfile
  education: ResumeEducationItem[]
  experiences: ResumeExperienceItem[]
  projects: ResumeProjectItem[]
  skills: ResumeSkillGroup[]
  highlights: ResumeHighlightItem[]
}

/**
 * 摘要元信息
 */
export interface ResumeSummaryMeta {
  slug: ResumeMeta['slug']
  defaultLocale: ResumeMeta['defaultLocale']
  locale: ResumeLocale
}

/**
 * 摘要资料
 */
export interface ResumeSummaryProfile {
  headline: string
  summary: string
}

/**
 * 摘要计数
 */
export interface ResumeSummaryCounts {
  education: number
  experiences: number
  projects: number
  skills: number
  highlights: number
}

/**
 * 简历摘要
 */
export interface ResumeSummary {
  meta: ResumeSummaryMeta
  profile: ResumeSummaryProfile
  counts: ResumeSummaryCounts
}

/**
 * 快照状态
 */
export type ResumeSnapshotStatus = 'draft' | 'published'

/**
 * 快照时间字段键
 */
export type ResumeSnapshotTimestampKey<S extends ResumeSnapshotStatus> =
  S extends 'draft' ? 'updatedAt' : 'publishedAt'

type ResumeSnapshotTimestampField<S extends ResumeSnapshotStatus> = {
  [K in ResumeSnapshotTimestampKey<S>]: string
}

/**
 * 简历快照
 */
export type ResumeSnapshot<S extends ResumeSnapshotStatus, TResume> = {
  status: S
  resume: TResume
} & ResumeSnapshotTimestampField<S>

/**
 * 草稿快照
 */
export type ResumeDraftSnapshot<TResume = StandardResume> = ResumeSnapshot<'draft', TResume>

/**
 * 已发布快照
 */
export type ResumePublishedSnapshot<TResume = StandardResume> = ResumeSnapshot<
  'published',
  TResume
>

/**
 * 草稿摘要快照
 */
export type ResumeDraftSummarySnapshot = ResumeDraftSnapshot<ResumeSummary>

/**
 * 发布摘要快照
 */
export type ResumePublishedSummarySnapshot = ResumePublishedSnapshot<ResumeSummary>

/**
 * 通用简历请求参数
 */
export interface ResumeRequestInput {
  apiBaseUrl: string
  requestPolicy?: RequestPolicy
}

/**
 * 鉴权简历请求参数
 */
export interface AuthenticatedResumeRequestInput extends ResumeRequestInput {
  accessToken: string
}

/**
 * 摘要请求参数
 */
export interface ResumeSummaryRequestInput extends ResumeRequestInput {
  locale?: ResumeLocale
}

/**
 * 鉴权摘要请求参数
 */
export interface AuthenticatedResumeSummaryRequestInput
  extends AuthenticatedResumeRequestInput {
  locale?: ResumeLocale
}

/**
 * 更新草稿请求参数
 */
export interface UpdateResumeDraftInput extends AuthenticatedResumeRequestInput {
  resume: StandardResume
}

