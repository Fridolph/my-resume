import { redirect } from 'next/navigation'

export default async function ChatGovernanceLocalePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  await params
  redirect('/dashboard/ai/chat-governance')
}
