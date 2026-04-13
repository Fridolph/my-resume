import { AiTalkAvatarShell } from './_avatar/avatar-shell'
import { loadAiTalkPageData } from '../_ai-talk/load-page-data'

export default async function AiTalkAvatarPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { apiBaseUrl, locale, publishedResume } = await loadAiTalkPageData(params)

  return (
    <AiTalkAvatarShell
      apiBaseUrl={apiBaseUrl}
      enableClientSync
      locale={locale}
      publishedResume={publishedResume}
    />
  )
}
