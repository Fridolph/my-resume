import { DEFAULT_API_BASE_URL } from '@core/env'
import { isAppLocale } from '@core/i18n/types'
import { createFetchPublishedResumeMethod } from '@shared/published-resume/services/published-resume-api'

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
  // web 首页只读取 published snapshot，不参与草稿态编辑
  const publishedResume = await createFetchPublishedResumeMethod({
    apiBaseUrl: DEFAULT_API_BASE_URL,
  })

  return (
    <PublishedResumeShell
      apiBaseUrl={DEFAULT_API_BASE_URL}
      enableClientSync
      locale={routeLocale}
      publishedResume={publishedResume}
    />
  )
}
