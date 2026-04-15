import type { AppLocale } from './locale'

export function formatDateTimeByLocale(dateTime: string, locale: AppLocale): string {
  return new Date(dateTime).toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US', {
    hour12: false,
  })
}

interface DateRangeLike {
  endDate: string
  startDate: string
}

export function formatDateRange(dateRange: DateRangeLike): string {
  return `${dateRange.startDate} - ${dateRange.endDate}`
}
