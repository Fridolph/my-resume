import dynamic from 'next/dynamic'

import { AdminRouteLoadingCard } from '../../[locale]/dashboard/_shared/route-loading-card'

const AdminResumeShell = dynamic(
  () =>
    import('../../[locale]/dashboard/resume/_resume/resume-shell').then(
      (module) => module.AdminResumeShell,
    ),
  {
    loading: () => <AdminRouteLoadingCard message="正在加载简历编辑页..." />,
  },
)

export default function AdminResumePage() {
  return <AdminResumeShell locale="zh" />
}
