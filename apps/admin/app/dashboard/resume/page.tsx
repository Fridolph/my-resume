import dynamic from 'next/dynamic'

import { AdminRouteLoadingCard } from '../../../components/admin/route-loading-card'

const AdminResumeShell = dynamic(
  () =>
    import('../../../components/admin/resume-shell').then(
      (module) => module.AdminResumeShell,
    ),
  {
    loading: () => <AdminRouteLoadingCard message="正在加载简历编辑页..." />,
  },
)

export default function AdminResumePage() {
  return <AdminResumeShell />
}
