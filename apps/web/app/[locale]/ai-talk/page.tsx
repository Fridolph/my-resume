import { AiTalkPlaceholderShell } from '@/modules/ai-talk/placeholder-shell'
import { DEFAULT_API_BASE_URL } from '@/core/env'
import { fetchPublishedResume } from '@/modules/published-resume/services/published-resume-api'
import { isAppLocale } from '@/i18n/types'

export default async function AiTalkPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const routeLocale = isAppLocale(locale) ? locale : 'zh'
  const publishedResume = await fetchPublishedResume({
    apiBaseUrl: DEFAULT_API_BASE_URL,
  })

  return (
    <AiTalkPlaceholderShell
      apiBaseUrl={DEFAULT_API_BASE_URL}
      enableClientSync
      locale={routeLocale}
      publishedResume={publishedResume}
    />
  )
}
