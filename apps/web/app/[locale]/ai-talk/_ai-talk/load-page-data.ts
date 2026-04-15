import { DEFAULT_API_BASE_URL } from '@core/env'
import { isAppLocale } from '@i18n/types'
import { createFetchPublishedResumeMethod } from '@shared/published-resume/services/published-resume-api'

export async function loadAiTalkPageData(params: Promise<{ locale: string }>) {
  const { locale } = await params
  const routeLocale = isAppLocale(locale) ? locale : 'zh'
  const publishedResume = await createFetchPublishedResumeMethod({
    apiBaseUrl: DEFAULT_API_BASE_URL,
  })

  return {
    apiBaseUrl: DEFAULT_API_BASE_URL,
    locale: routeLocale,
    publishedResume,
  }
}
