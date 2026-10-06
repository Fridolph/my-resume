import type { ReactNode } from 'react'

import { AdminLayout } from '@shared/components/layout/admin-layout'

/**
 * 后台路由组布局：(dashboard) 下的所有页面共享后台壳。
 */
export default function DashboardGroupLayout({ children }: { children: ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>
}
