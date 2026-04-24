import type { AppLocale } from './locale'

const RESUME_DISPLAY_TIME_ZONE = 'Asia/Shanghai'

export function formatDateTimeByLocale(dateTime: string, locale: AppLocale): string {
  return new Date(dateTime).toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US', {
    hour12: false,
    timeZone: RESUME_DISPLAY_TIME_ZONE,
  })
}

interface DateRangeLike {
  endDate: string
  startDate: string
}

const zhPresentTokens = new Set(['至今', '目前', '现在'])
const enPresentTokens = new Set(['present', 'current', 'ongoing'])

function resolveLocalizedEndDate(endDate: string, locale: AppLocale): string {
  const normalized = endDate.trim()

  if (locale === 'en') {
    return zhPresentTokens.has(normalized) ? 'Present' : endDate
  }

  return enPresentTokens.has(normalized.toLowerCase()) ? '至今' : endDate
}

export function formatDateRange(dateRange: DateRangeLike, locale?: AppLocale): string {
  const localizedEndDate = locale
    ? resolveLocalizedEndDate(dateRange.endDate, locale)
    : dateRange.endDate

  return `${dateRange.startDate} - ${localizedEndDate}`
}
