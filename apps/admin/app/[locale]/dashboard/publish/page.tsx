import { redirect } from 'next/navigation'

export default async function AdminPublishPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  await params
  redirect('/dashboard/publish')
}
