import { AiTalkChatEntryShell } from './_chat/chat-entry-shell'
import { loadAiTalkPageData } from '../_ai-talk/load-page-data'

export default async function AiTalkChatPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { apiBaseUrl, locale, publishedResume } = await loadAiTalkPageData(params)

  return (
    <AiTalkChatEntryShell
      apiBaseUrl={apiBaseUrl}
      enableClientSync
      locale={locale}
      publishedResume={publishedResume}
    />
  )
}
