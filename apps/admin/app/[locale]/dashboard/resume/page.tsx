import { redirect } from 'next/navigation'

export default async function AdminResumePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  await params
  redirect('/dashboard/resume')
}
