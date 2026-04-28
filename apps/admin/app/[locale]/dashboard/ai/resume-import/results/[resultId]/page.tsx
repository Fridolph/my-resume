import { redirect } from 'next/navigation'

export default async function ResumeImportResultLocalePage({
  params,
}: {
  params: Promise<{ locale: string; resultId: string }>
}) {
  const { resultId } = await params
  redirect(`/dashboard/ai/resume-import/results/${resultId}`)
}
