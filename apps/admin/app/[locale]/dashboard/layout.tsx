import '../../admin-shell.css'
import type { ReactNode } from 'react'

import { isAppLocale } from '@core/i18n/types'

import { AdminProtectedLayoutWithLocale } from './_shared/protected-layout'

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
