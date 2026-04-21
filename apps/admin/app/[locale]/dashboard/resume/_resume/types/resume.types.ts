/**
 * admin 侧简历域类型统一出口。
 *
 * 说明：
 * - 统一复用 `@my-resume/api-client` 契约类型，避免本地重复定义。
 * - 此文件仅做 re-export，不新增字段语义。
 */
export type {
  LocalizedText,
  ResumeDraftSnapshot,
  ResumeDraftSummarySnapshot,
  ResumeEducationItem,
  ResumeExperienceItem,
  ResumeHighlightItem,
  ResumeLocale,
  ResumeMeta,
  ResumePublishedSnapshot,
  ResumePublishedSummarySnapshot,
  ResumeProfile,
  ResumeProfileHero,
  ResumeProfileInterestItem,
  ResumeProfileLink,
  ResumeProjectItem,
  ResumeSummary,
  ResumeSummaryCounts,
  ResumeSummaryMeta,
  ResumeSummaryProfile,
  ResumeSkillGroup,
  StandardResume,
} from '@my-resume/api-client'
