import './admin-shell.css'
import dynamic from 'next/dynamic'

import { AdminRouteLoadingCard } from '../components/admin/route-loading-card'

const AdminLoginShell = dynamic(
  () => import('../components/admin/login-shell').then((module) => module.AdminLoginShell),
  {
    loading: () => <AdminRouteLoadingCard message="正在加载后台登录页..." />,
  },
)

export default function AdminLoginPage() {
  return <AdminLoginShell />
}
