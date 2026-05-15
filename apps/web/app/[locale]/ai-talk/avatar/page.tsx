import { AiTalkAvatarShell } from './_avatar/avatar-shell'
import { loadAiTalkPageData } from '../_ai-talk/load-page-data'

export default async function AiTalkAvatarPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { apiBaseUrl, initialLoadError, locale, publishedResume } =
    await loadAiTalkPageData(params)

  return (
    <AiTalkAvatarShell
      apiBaseUrl={apiBaseUrl}
      enableClientSync
      initialLoadError={initialLoadError}
      locale={locale}
      publishedResume={publishedResume}
    />
  )
}
