import dynamic from 'next/dynamic'

import { AdminRouteLoadingCard } from '../../[locale]/dashboard/_shared/route-loading-card'

const AdminPublishShell = dynamic(
  () =>
    import('../../[locale]/dashboard/publish/_publish/publish-shell').then(
      (module) => module.AdminPublishShell,
    ),
  {
    loading: () => <AdminRouteLoadingCard message="正在加载发布与导出页..." />,
  },
)

export default function AdminPublishPage() {
  return <AdminPublishShell locale="zh" />
}
