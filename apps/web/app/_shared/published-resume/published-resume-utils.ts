import {
  LocalizedText,
  ResumeEducationItem,
  ResumeExperienceItem,
  ResumeLocale,
  ResumeProjectItem,
} from './types/published-resume.types'

export function readLocalizedText(value: LocalizedText, locale: ResumeLocale): string {
  return value[locale]
}

export function formatPeriod(
  item: ResumeProjectItem | ResumeExperienceItem | ResumeEducationItem,
): string {
  return `${item.startDate} - ${item.endDate}`
}

export function formatPublishedAt(publishedAt: string, locale: ResumeLocale): string {
  return new Date(publishedAt).toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US', {
    hour12: false,
  })
}
