import { DEFAULT_API_BASE_URL, DEFAULT_SERVER_API_BASE_URL } from '@core/env'
import { isAppLocale } from '@i18n/types'
import { loadPublishedResumeSafely } from '@shared/published-resume/services/published-resume-safe-load'

export async function loadAiTalkPageData(params: Promise<{ locale: string }>) {
  const { locale } = await params
  const routeLocale = isAppLocale(locale) ? locale : 'zh'
  const { initialLoadError, publishedResume } = await loadPublishedResumeSafely({ locale: locale as "zh" | "en",
    apiBaseUrl: DEFAULT_SERVER_API_BASE_URL,
  })

  return {
    apiBaseUrl: DEFAULT_API_BASE_URL,
    initialLoadError,
    locale: routeLocale,
    publishedResume,
  }
}
