import { DEFAULT_API_BASE_URL, DEFAULT_SERVER_API_BASE_URL } from '@core/env'
import { isAppLocale } from '@i18n/types'
import { loadPublishedResumeSafely } from '@shared/published-resume/services/published-resume-safe-load'

import { PublishedResumeShell } from './_resume/shell'

/**
 * 首页服务端入口先读取已发布简历，再交给客户端展示壳承接交互
 *
 * @returns 公开站首页节点
 */
export default async function WebHomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const routeLocale = isAppLocale(locale) ? locale : 'zh'
  const { initialLoadError, publishedResume } = await loadPublishedResumeSafely({
    apiBaseUrl: DEFAULT_SERVER_API_BASE_URL,
  })

  return (
    <PublishedResumeShell
      apiBaseUrl={DEFAULT_API_BASE_URL}
      enableClientSync
      initialLoadError={initialLoadError}
      locale={routeLocale}
      publishedResume={publishedResume}
    />
  )
}
