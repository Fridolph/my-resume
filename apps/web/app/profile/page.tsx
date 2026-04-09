import { ProfileOverviewShell } from '../../components/profile/overview-shell'
import { DEFAULT_API_BASE_URL } from '../../lib/env'
import { fetchPublishedResume } from '../../lib/published-resume-api'

export default async function ProfilePage() {
  const publishedResume = await fetchPublishedResume({
    apiBaseUrl: DEFAULT_API_BASE_URL,
  })

  return <ProfileOverviewShell publishedResume={publishedResume} />
}
