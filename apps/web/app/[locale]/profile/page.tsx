import { ProfileOverviewShell } from '../../../modules/profile/overview-shell'
import { DEFAULT_API_BASE_URL } from '../../../core/env'
import { fetchPublishedResume } from '../../../modules/published-resume/services/published-resume-api'
import { isAppLocale } from '../../../i18n/types'

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const routeLocale = isAppLocale(locale) ? locale : 'zh'
  const publishedResume = await fetchPublishedResume({
    apiBaseUrl: DEFAULT_API_BASE_URL,
  })

  return (
    <ProfileOverviewShell
      apiBaseUrl={DEFAULT_API_BASE_URL}
      enableClientSync
      locale={routeLocale}
      publishedResume={publishedResume}
    />
  )
}
