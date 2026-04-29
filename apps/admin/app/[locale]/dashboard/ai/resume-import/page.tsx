import { redirect } from 'next/navigation'

export default async function ResumeImportLocalePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  await params
  redirect('/dashboard/ai/resume-import')
}
