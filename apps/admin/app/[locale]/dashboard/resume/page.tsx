import dynamic from 'next/dynamic'

import { isAppLocale } from '@core/i18n/types'

import { AdminRouteLoadingCard } from '../_shared/route-loading-card'

const AdminResumeShell = dynamic(
  () => import('./_resume/resume-shell').then((module) => module.AdminResumeShell),
  {
    loading: () => <AdminRouteLoadingCard message="正在加载简历编辑页..." />,
  },
)

export default async function AdminResumePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const routeLocale = isAppLocale(locale) ? locale : 'zh'

  return <AdminResumeShell locale={routeLocale} />
}
