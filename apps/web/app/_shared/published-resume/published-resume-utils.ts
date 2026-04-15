import { formatDateTimeByLocale, readLocalizedText } from '@my-resume/utils'

export { readLocalizedText }

export function formatPublishedAt(publishedAt: string, locale: 'zh' | 'en'): string {
  return formatDateTimeByLocale(publishedAt, locale)
}
