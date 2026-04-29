import dynamic from 'next/dynamic'

import { AdminRouteLoadingCard } from '../../../[locale]/dashboard/_shared/route-loading-card'

const ResumeImportShell = dynamic(
  () =>
    import('../../../[locale]/dashboard/ai/_ai/resume-import-shell').then(
      (module) => module.ResumeImportShell,
    ),
  {
    loading: () => <AdminRouteLoadingCard message="正在加载简历导入识别..." />,
  },
)

export default function ResumeImportPage() {
  return <ResumeImportShell locale="zh" />
}
