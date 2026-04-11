import dynamic from 'next/dynamic'

import { isAppLocale } from '@core/i18n/types'

import { AdminRouteLoadingCard } from '../_shared/route-loading-card'

const AdminPublishShell = dynamic(
  () => import('./_publish/publish-shell').then((module) => module.AdminPublishShell),
  {
    loading: () => <AdminRouteLoadingCard message="正在加载发布与导出页..." />,
  },
)

export default async function AdminPublishPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const routeLocale = isAppLocale(locale) ? locale : 'zh'

  return <AdminPublishShell locale={routeLocale} />
}
