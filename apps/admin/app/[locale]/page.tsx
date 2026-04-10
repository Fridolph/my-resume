import '../admin-shell.css'

import { AdminLoginShell } from '../../modules/auth/login-shell'
import { isAppLocale } from '../../i18n/types'

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
