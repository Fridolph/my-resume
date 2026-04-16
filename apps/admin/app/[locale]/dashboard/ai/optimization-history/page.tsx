import { redirect } from 'next/navigation'

export default async function AdminAiOptimizationHistoryPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  await params
  redirect('/dashboard/ai/optimization-history')
}
