import '../admin-shell.css'
import dynamic from 'next/dynamic'
import type { ReactNode } from 'react'

import { AdminRouteLoadingCard } from '../../modules/workspace/route-loading-card'

const AdminProtectedLayout = dynamic(
  () =>
    import('../../modules/workspace/protected-layout').then(
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
