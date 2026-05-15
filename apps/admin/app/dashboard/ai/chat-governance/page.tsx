import dynamic from 'next/dynamic'

import { AdminRouteLoadingCard } from '../../../[locale]/dashboard/_shared/route-loading-card'

const ChatGovernanceShell = dynamic(
  () =>
    import(
      '../../../[locale]/dashboard/ai/chat-governance/_chat-governance/chat-governance-shell'
    ).then((module) => module.ChatGovernanceShell),
  {
    loading: () => <AdminRouteLoadingCard message="正在加载 AI Chat 治理..." />,
  },
)

export default function ChatGovernancePage() {
  return <ChatGovernanceShell />
}
