import { redirect } from 'next/navigation'

export default async function KnowledgeLocalePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  await params
  redirect('/dashboard/ai/knowledge')
}
