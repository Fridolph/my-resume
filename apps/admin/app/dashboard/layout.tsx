import '../admin-shell.css'
import type { ReactNode } from 'react'

import { AdminProtectedLayout } from '../[locale]/dashboard/_shared/protected-layout'

export default function DashboardLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return <AdminProtectedLayout>{children}</AdminProtectedLayout>
}
