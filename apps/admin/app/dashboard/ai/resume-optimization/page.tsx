import dynamic from 'next/dynamic'

import { AdminRouteLoadingCard } from '../../../[locale]/dashboard/_shared/route-loading-card'

const ResumeOptimizationShell = dynamic(
  () =>
    import('../../../[locale]/dashboard/ai/_ai/resume-optimization-shell').then(
      (module) => module.ResumeOptimizationShell,
    ),
  {
    loading: () => <AdminRouteLoadingCard message="正在加载简历针对性分析..." />,
  },
)

export default function ResumeOptimizationPage() {
  return <ResumeOptimizationShell locale="zh" />
}
