import dynamic from 'next/dynamic'
import { AdminRouteLoadingCard } from '../../../[locale]/dashboard/_shared/route-loading-card'

const RagManageShell = dynamic(
  () => import('../../../[locale]/dashboard/ai/_ai/rag-manage-shell').then((m) => m.RagManageShell),
  { loading: () => <AdminRouteLoadingCard message="正在加载 RAG 管理..." /> },
)

export default function RagManagePage() {
  return <RagManageShell locale="zh" />
}
