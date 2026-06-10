import { AiTalkIntroShell } from './_intro/intro-shell'
import { loadAiTalkPageData } from '../_ai-talk/load-page-data'

export default async function AiTalkIntroPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { apiBaseUrl, initialLoadError, locale, publishedResume } =
    await loadAiTalkPageData(params)

  return (
    <AiTalkIntroShell
      apiBaseUrl={apiBaseUrl}
      enableClientSync
      initialLoadError={initialLoadError}
      locale={locale}
      publishedResume={publishedResume}
    />
  )
}
