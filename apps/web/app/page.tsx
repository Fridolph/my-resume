import { PublishedResumeShell } from '../modules/published-resume/shell'
import { DEFAULT_API_BASE_URL } from '../core/env'
import { fetchPublishedResume } from '../modules/published-resume/services/published-resume-api'

export default async function WebHomePage() {
  const publishedResume = await fetchPublishedResume({
    apiBaseUrl: DEFAULT_API_BASE_URL,
  })

  return (
    <PublishedResumeShell
      apiBaseUrl={DEFAULT_API_BASE_URL}
      publishedResume={publishedResume}
    />
  )
}
