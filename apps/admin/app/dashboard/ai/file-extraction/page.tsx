import dynamic from 'next/dynamic'

import { AdminRouteLoadingCard } from '../../../[locale]/dashboard/_shared/route-loading-card'

const FileExtractionShell = dynamic(
  () =>
    import('../../../[locale]/dashboard/ai/_ai/file-extraction-shell').then(
      (module) => module.FileExtractionShell,
    ),
  {
    loading: () => <AdminRouteLoadingCard message="正在加载文件提取诊断..." />,
  },
)

export default function FileExtractionPage() {
  return <FileExtractionShell locale="zh" />
}
