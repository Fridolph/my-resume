import {
  createFetchDraftResumeMethod,
  createUpdateDraftResumeMethod,
} from '../services/resume-draft-api'

export interface ResumeDraftEditorPanelProps {
  accessToken: string
  apiBaseUrl: string
  canEdit: boolean
  loadDraft?: typeof createFetchDraftResumeMethod
  saveDraft?: typeof createUpdateDraftResumeMethod
}
