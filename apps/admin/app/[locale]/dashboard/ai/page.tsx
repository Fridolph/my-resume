import { redirect } from 'next/navigation'

export default async function AdminAiWorkbenchPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  await params
  redirect('/dashboard/ai')
}
