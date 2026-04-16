import dynamic from 'next/dynamic'

import { AdminRouteLoadingCard } from '../../../../../[locale]/dashboard/_shared/route-loading-card'

const ResumeOptimizationResultShell = dynamic(
  () =>
    import('../../../../../[locale]/dashboard/ai/_ai/resume-optimization-result-shell').then(
      (module) => module.ResumeOptimizationResultShell,
    ),
  {
    loading: () => <AdminRouteLoadingCard message="正在加载优化结果..." />,
  },
)

export default async function ResumeOptimizationResultPage({
  params,
}: {
  params: Promise<{ resultId: string }>
}) {
  const { resultId } = await params

  return <ResumeOptimizationResultShell locale="zh" resultId={resultId} />
}
