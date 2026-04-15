import { AiTalkEntryShell } from './_ai-talk/entry-shell'
import { loadAiTalkPageData } from './_ai-talk/load-page-data'

export default async function AiTalkPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { apiBaseUrl, locale, publishedResume } = await loadAiTalkPageData(params)

  return (
    <AiTalkEntryShell
      apiBaseUrl={apiBaseUrl}
      enableClientSync
      locale={locale}
      publishedResume={publishedResume}
    />
  )
}
