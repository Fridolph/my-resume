import { ensureDraftResume } from '../../../core/admin-resource-store'
import { updateDraftResume } from '../services/resume-draft-api'

export interface ResumeDraftEditorPanelProps {
  accessToken: string
  apiBaseUrl: string
  canEdit: boolean
  loadDraft?: typeof ensureDraftResume
  saveDraft?: typeof updateDraftResume
}
