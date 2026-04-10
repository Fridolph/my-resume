import { AdminDashboardShell } from '@/modules/workspace/dashboard-shell'
import { isAppLocale } from '@/i18n/types'

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const routeLocale = isAppLocale(locale) ? locale : 'zh'

  return <AdminDashboardShell locale={routeLocale} />
}
