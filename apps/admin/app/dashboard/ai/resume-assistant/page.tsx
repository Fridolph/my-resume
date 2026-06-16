import dynamic from 'next/dynamic'
import { AdminRouteLoadingCard } from '../../../[locale]/dashboard/_shared/route-loading-card'

const ResumeAssistantShell = dynamic(
  () => import('../../../[locale]/dashboard/ai/_ai/resume-assistant-shell').then((m) => m.ResumeAssistantShell),
  { loading: () => <AdminRouteLoadingCard message="正在加载简历助手..." /> },
)

export default function ResumeAssistantPage() {
  return <ResumeAssistantShell />
}
