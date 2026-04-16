import dynamic from 'next/dynamic'

import { AdminRouteLoadingCard } from '../../../[locale]/dashboard/_shared/route-loading-card'

const AdminAiOptimizationHistoryShell = dynamic(
  () =>
    import('../../../[locale]/dashboard/ai/_ai/optimization-history-shell').then(
      (module) => module.AdminAiOptimizationHistoryShell,
    ),
  {
    loading: () => <AdminRouteLoadingCard message="正在加载优化记录..." />,
  },
)

export default function AdminAiOptimizationHistoryPage() {
  return <AdminAiOptimizationHistoryShell locale="zh" />
}
