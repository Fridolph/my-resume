import {
  fetchDraftResume,
  updateDraftResume,
} from '../services/resume-draft-api'

export interface ResumeDraftEditorPanelProps {
  accessToken: string
  apiBaseUrl: string
  canEdit: boolean
  loadDraft?: typeof fetchDraftResume
  saveDraft?: typeof updateDraftResume
}
