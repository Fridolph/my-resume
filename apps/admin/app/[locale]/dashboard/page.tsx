import { isAppLocale } from '@i18n/types'

import { AdminDashboardShell } from './_shared/dashboard-shell'

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const routeLocale = isAppLocale(locale) ? locale : 'zh'

  return <AdminDashboardShell locale={routeLocale} />
}
