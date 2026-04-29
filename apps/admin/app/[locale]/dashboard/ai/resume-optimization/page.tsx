import { redirect } from 'next/navigation'

export default async function ResumeOptimizationLocalePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  await params
  redirect('/dashboard/ai/resume-optimization')
}
