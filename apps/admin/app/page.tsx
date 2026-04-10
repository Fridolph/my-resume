import './admin-shell.css'

import { AdminLoginShell } from '../modules/auth/login-shell'

/**
 * 后台首页保持极薄，只负责挂载登录壳
 *
 * @returns 后台登录页节点
 */
export default function AdminLoginPage() {
  return <AdminLoginShell />
}
