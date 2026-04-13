import { AiTalkResumeAdvisorShell } from './_resume-advisor/resume-advisor-shell'
import { loadAiTalkPageData } from '../_ai-talk/load-page-data'

export default async function AiTalkResumeAdvisorPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { apiBaseUrl, locale, publishedResume } = await loadAiTalkPageData(params)

  return (
    <AiTalkResumeAdvisorShell
      apiBaseUrl={apiBaseUrl}
      enableClientSync
      locale={locale}
      publishedResume={publishedResume}
    />
  )
}
