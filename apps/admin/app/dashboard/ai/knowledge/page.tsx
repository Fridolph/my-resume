import dynamic from 'next/dynamic'

import { AdminRouteLoadingCard } from '../../../[locale]/dashboard/_shared/route-loading-card'

const KnowledgeIngestionShell = dynamic(
  () =>
    import('../../../[locale]/dashboard/ai/_ai/knowledge-ingestion-shell').then(
      (module) => module.KnowledgeIngestionShell,
    ),
  {
    loading: () => <AdminRouteLoadingCard message="正在加载 RAG 资料入库..." />,
  },
)

export default function KnowledgePage() {
  return <KnowledgeIngestionShell locale="zh" />
}
