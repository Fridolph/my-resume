import dynamic from 'next/dynamic'

import { AdminRouteLoadingCard } from '../../../components/admin/route-loading-card'

const AdminAiWorkbenchShell = dynamic(
  () =>
    import('../../../components/admin/ai-workbench-shell').then(
      (module) => module.AdminAiWorkbenchShell,
    ),
  {
    loading: () => <AdminRouteLoadingCard message="正在加载 AI 工作台..." />,
  },
)

export default function AdminAiWorkbenchPage() {
  return <AdminAiWorkbenchShell />
}
