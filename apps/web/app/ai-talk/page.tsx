import { AiTalkPlaceholderShell } from '../../modules/ai-talk/placeholder-shell'
import { DEFAULT_API_BASE_URL } from '../../core/env'
import { fetchPublishedResume } from '../../modules/published-resume/services/published-resume-api'

export default async function AiTalkPage() {
  const publishedResume = await fetchPublishedResume({
    apiBaseUrl: DEFAULT_API_BASE_URL,
  })

  return (
    <AiTalkPlaceholderShell
      apiBaseUrl={DEFAULT_API_BASE_URL}
      enableClientSync
      publishedResume={publishedResume}
    />
  )
}
