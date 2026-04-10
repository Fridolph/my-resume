import dynamic from 'next/dynamic'

import { AdminRouteLoadingCard } from '../../../../modules/workspace/route-loading-card'
import { isAppLocale } from '../../../../i18n/types'

const AdminPublishShell = dynamic(
  () =>
    import('../../../../modules/publish/publish-shell').then(
      (module) => module.AdminPublishShell,
    ),
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
