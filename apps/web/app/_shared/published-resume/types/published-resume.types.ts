/**
 * web 公开站简历类型统一出口。
 *
 * 说明：
 * - 统一复用 `@my-resume/api-client` 契约类型。
 * - 本文件仅做 re-export，避免重复定义。
 */
export type {
  LocalizedText,
  ResumeEducationItem,
  ResumeExperienceItem,
  ResumeHighlightItem,
  ResumeLocale,
  ResumeProfile,
  ResumeProfileHero,
  ResumeProfileInterestItem,
  ResumeProfileLink,
  ResumeProjectItem,
  ResumePublishedSnapshot,
  ResumeSkillGroup,
  StandardResume,
} from '@my-resume/api-client'
