import dynamic from 'next/dynamic'

import { AdminRouteLoadingCard } from '../../../../../[locale]/dashboard/_shared/route-loading-card'

const ResumeImportResultShell = dynamic(
  () =>
    import('../../../../../[locale]/dashboard/ai/_ai/resume-import-result-shell').then(
      (module) => module.ResumeImportResultShell,
    ),
  {
    loading: () => <AdminRouteLoadingCard message="正在加载简历导入结果..." />,
  },
)

export default async function ResumeImportResultPage({
  params,
}: {
  params: Promise<{ resultId: string }>
}) {
  const { resultId } = await params

  return <ResumeImportResultShell locale="zh" resultId={resultId} />
}
