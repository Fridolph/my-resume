import { invalidateDraftResumeResources } from '@/core/admin-resource-store'
import type { ResumeDraftSnapshot, StandardResume } from '../types/resume.types'
import type { ResumeDraftEditorPanelProps } from '../types/draft-editor-panel.types'
import { cloneResume } from './draft-editor-helpers'

interface SubmitDraftResumeArgs
  extends Pick<ResumeDraftEditorPanelProps, 'accessToken' | 'apiBaseUrl'> {
  resumeDraft: StandardResume
  saveDraft: NonNullable<ResumeDraftEditorPanelProps['saveDraft']>
}

export async function submitDraftResume({
  accessToken,
  apiBaseUrl,
  resumeDraft,
  saveDraft,
}: SubmitDraftResumeArgs): Promise<ResumeDraftSnapshot> {
  const nextSnapshot = await saveDraft({
    apiBaseUrl,
    accessToken,
    resume: cloneResume(resumeDraft),
  })

  invalidateDraftResumeResources({
    accessToken,
    apiBaseUrl,
  })

  return nextSnapshot
}
