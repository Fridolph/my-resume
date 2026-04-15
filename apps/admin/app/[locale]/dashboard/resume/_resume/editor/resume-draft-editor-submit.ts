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
  return saveDraft({
    apiBaseUrl,
    accessToken,
    resume: cloneResume(resumeDraft),
  })
}
