import dynamic from 'next/dynamic'

import { AdminRouteLoadingCard } from '../../../components/admin/route-loading-card'

const AdminPublishShell = dynamic(
  () =>
    import('../../../components/admin/publish-shell').then(
      (module) => module.AdminPublishShell,
    ),
  {
    loading: () => <AdminRouteLoadingCard message="正在加载发布与导出页..." />,
  },
)

export default function AdminPublishPage() {
  return <AdminPublishShell />
}
