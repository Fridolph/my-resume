import { AiTalkSessionShell } from './_session/session-shell'
import { loadAiTalkPageData } from '../../_ai-talk/load-page-data'

export default async function AiTalkSessionPage({
  params,
}: {
  params: Promise<{ locale: string; sessionId: string }>
}) {
  const { sessionId, ...rest } = await params
  const { apiBaseUrl, locale, publishedResume } = await loadAiTalkPageData(
    Promise.resolve(rest),
  )

  return (
    <AiTalkSessionShell
      apiBaseUrl={apiBaseUrl}
      enableClientSync
      locale={locale}
      publishedResume={publishedResume}
      sessionId={sessionId}
    />
  )
}
