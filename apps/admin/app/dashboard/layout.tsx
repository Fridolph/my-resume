import '../admin-shell.css'
import type { ReactNode } from 'react'

import { AdminProtectedLayout } from '../../modules/workspace/protected-layout'

export default function DashboardLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return <AdminProtectedLayout>{children}</AdminProtectedLayout>
}
