import {
  createFetchDraftResumeMethod,
  createUpdateDraftResumeMethod,
} from '../services/resume-draft-api'

/**
 * 草稿编辑面板组件入参。
 */
export interface ResumeDraftEditorPanelProps {
  accessToken: string
  apiBaseUrl: string
  canEdit: boolean
  loadDraft?: typeof createFetchDraftResumeMethod
  saveDraft?: typeof createUpdateDraftResumeMethod
}
