import dynamic from 'next/dynamic'

import { AdminRouteLoadingCard } from '../../components/admin/route-loading-card'

const AdminDashboardShell = dynamic(
  () =>
    import('../../components/admin/dashboard-shell').then(
      (module) => module.AdminDashboardShell,
    ),
  {
    loading: () => <AdminRouteLoadingCard message="正在加载工作区概览..." />,
  },
)

export default function AdminDashboardPage() {
  return <AdminDashboardShell />
}
