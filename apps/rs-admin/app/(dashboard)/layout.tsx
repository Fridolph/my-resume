import type { ReactNode } from 'react'

import { AdminLayout } from '@shared/components/layout/admin-layout'
import { AuthGuard } from '@shared/components/auth/auth-guard'

/**
 * 后台路由组布局：(dashboard) 下的所有页面共享后台壳 + 登录守卫。
 */
export default function DashboardGroupLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <AdminLayout>{children}</AdminLayout>
    </AuthGuard>
  )
}
