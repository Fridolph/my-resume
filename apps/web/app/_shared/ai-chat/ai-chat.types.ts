import type { AiChatMessageBlock, AiChatSession, AiChatSummarySnapshot, RagAskCitation } from '@my-resume/api-client'

export type AiChatDrawerState = 'closed' | 'minimized' | 'open'

export interface AiChatPresentation {
  assistantAvatarSrc: string | null
  assistantLabel: string
  visitorLabel: string
}

export interface AiChatDraftAssistantMessage {
  answerBlocks: AiChatMessageBlock[]
  assistantMessageId: string | null
  citations: RagAskCitation[]
  content: string
}

export interface AiChatContextValue {
  acceptConsent: () => Promise<void>
  clearPresentation: () => void
  closeSession: () => Promise<void>
  draftAssistantMessage: AiChatDraftAssistantMessage | null
  drawerState: AiChatDrawerState
  dismissConsentModal: () => void
  errorMessage: string | null
  hasConsentForToday: boolean
  isBootstrappingSession: boolean
  isConsentModalOpen: boolean
  isDrawerOpen: boolean
  isDrawerVisible: boolean
  isStreaming: boolean
  hideDrawer: () => void
  minimizeDrawer: () => void
  openDrawer: () => void
  presentation: AiChatPresentation
  refreshSession: () => Promise<void>
  registerPresentation: (input: AiChatPresentation) => void
  restoreDrawer: () => void
  restoreReady: boolean
  sendMessage: (input: { content: string }) => Promise<boolean>
  session: AiChatSession | null
  summaryPreview: AiChatSummarySnapshot | null
  useKeyStatus: string | null
  view: 'loading' | 'chat' | 'closed'
}
