import { redirect } from 'next/navigation'

export default async function FileExtractionLocalePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  await params
  redirect('/dashboard/ai/file-extraction')
}
