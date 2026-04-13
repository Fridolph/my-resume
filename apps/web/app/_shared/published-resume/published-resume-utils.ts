import { formatDateTimeByLocale, readLocalizedText } from '@my-resume/utils'

import {
  ResumeEducationItem,
  ResumeExperienceItem,
  ResumeProjectItem,
} from './types/published-resume.types'

export { readLocalizedText }

export function formatPeriod(
  item: ResumeProjectItem | ResumeExperienceItem | ResumeEducationItem,
): string {
  return `${item.startDate} - ${item.endDate}`
}

export function formatPublishedAt(publishedAt: string, locale: 'zh' | 'en'): string {
  return formatDateTimeByLocale(publishedAt, locale)
}
