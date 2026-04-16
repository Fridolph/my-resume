import { redirect } from 'next/navigation'

export default async function ResumeOptimizationResultLocalePage({
  params,
}: {
  params: Promise<{ locale: string; resultId: string }>
}) {
  const { resultId } = await params
  redirect(`/dashboard/ai/resume-optimization/results/${resultId}`)
}
