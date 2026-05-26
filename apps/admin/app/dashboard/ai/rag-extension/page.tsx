import dynamic from 'next/dynamic'

import { AdminRouteLoadingCard } from '../../../[locale]/dashboard/_shared/route-loading-card'

const RagExtensionShell = dynamic(
  () =>
    import('../../../[locale]/dashboard/ai/_ai/rag-extension-shell').then(
      (module) => module.RagExtensionShell,
    ),
  {
    loading: () => <AdminRouteLoadingCard message="正在加载 RAG 资料扩展..." />,
  },
)

export default function RagExtensionPage() {
  return <RagExtensionShell locale="zh" />
}
