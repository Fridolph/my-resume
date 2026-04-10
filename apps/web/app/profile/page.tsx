import { ProfileOverviewShell } from '../../modules/profile/overview-shell'
import { DEFAULT_API_BASE_URL } from '../../core/env'
import { fetchPublishedResume } from '../../modules/published-resume/services/published-resume-api'

export default async function ProfilePage() {
  const publishedResume = await fetchPublishedResume({
    apiBaseUrl: DEFAULT_API_BASE_URL,
  })

  return <ProfileOverviewShell publishedResume={publishedResume} />
}
