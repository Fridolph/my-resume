import '../admin-shell.css'
import dynamic from 'next/dynamic'
import type { ReactNode } from 'react'

import { AdminRouteLoadingCard } from '../../components/admin/route-loading-card'

const AdminProtectedLayout = dynamic(
  () =>
    import('../../components/admin/protected-layout').then(
      (module) => module.AdminProtectedLayout,
    ),
  {
    loading: () => <AdminRouteLoadingCard message="正在加载后台工作区..." />,
  },
)

export default function DashboardLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return <AdminProtectedLayout>{children}</AdminProtectedLayout>
}
