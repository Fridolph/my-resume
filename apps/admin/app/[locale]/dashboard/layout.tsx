import '../../admin-shell.css'
import type { ReactNode } from 'react'

import { AdminProtectedLayoutWithLocale } from '@/modules/workspace/protected-layout'
import { isAppLocale } from '@/i18n/types'

export default async function DashboardLayout({
  children,
  params,
}: Readonly<{
  children: ReactNode
  params: Promise<{ locale: string }>
}>) {
  const { locale } = await params
  const routeLocale = isAppLocale(locale) ? locale : 'zh'

  return <AdminProtectedLayoutWithLocale locale={routeLocale}>{children}</AdminProtectedLayoutWithLocale>
}
