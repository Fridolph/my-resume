import { DEFAULT_API_BASE_URL } from '@core/env'
import { isAppLocale } from '@i18n/types'
import { createFetchPublishedResumeMethod } from '@shared/published-resume/services/published-resume-api'

import { ProfileOverviewShell } from './_profile/overview-shell'

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const routeLocale = isAppLocale(locale) ? locale : 'zh'
  const publishedResume = await createFetchPublishedResumeMethod({
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
