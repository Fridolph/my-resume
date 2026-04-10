import dynamic from 'next/dynamic'

import { AdminRouteLoadingCard } from '@/modules/workspace/route-loading-card'
import { isAppLocale } from '@/i18n/types'

const AdminResumeShell = dynamic(
  () =>
    import('@/modules/resume/resume-shell').then(
      (module) => module.AdminResumeShell,
    ),
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
