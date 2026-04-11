import '../admin-shell.css'

import { isAppLocale } from '@core/i18n/types'

import { AdminLoginShell } from './_auth/login-shell'

/**
 * 后台首页保持极薄，只负责挂载登录壳
 *
 * @returns 后台登录页节点
 */
export default async function AdminLoginPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const routeLocale = isAppLocale(locale) ? locale : 'zh'

  return <AdminLoginShell locale={routeLocale} />
}
