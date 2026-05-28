import type { RagAskCitation } from '../rag/rag.types'

export type AiChatLocale = 'zh' | 'en'
export type AiChatLeadStatus = 'submitted' | 'issued' | 'closed'
export type AiChatUseKeyStatus = 'issued' | 'claimed' | 'revoked' | 'expired'
export type AiChatSessionStatus = 'open' | 'closed'
export type AiChatMessageRole = 'user' | 'assistant' | 'system'
export type AiChatSummaryStage = 'turn-10' | 'turn-20'
export type AiChatMessageBlockType =
  | 'text'
  | 'project_card'
  | 'experience_card'
  | 'article_card'
  | 'media_card'
  | 'hobby_card'
  | 'system_notice'
  | 'summary'

export interface AiChatLeadInput {
  companyName?: string
  contact?: string
  displayName: string
  locale: AiChatLocale
  message: string
  metadataJson?: Record<string, unknown> | null
  sourceKey?: string | null
  sourceTag?: string | null
}

export interface AiChatLeadSummary {
  id: string
  locale: AiChatLocale
  displayName: string
  companyName: string
  contact: string
  message: string
  status: AiChatLeadStatus
  createdAt: string
  updatedAt: string
}

export interface AiChatIssueUseKeyInput {
  expiresAt?: string
  leadId: string
  issuedByUserId: string
  locale?: AiChatLocale
}

export interface AiChatUseKeySummary {
  id: string
  useKey: string
  leadId: string
  sessionId: string | null
  status: AiChatUseKeyStatus
  maxTurns: number
  usedTurns: number
  expiresAt: string | null
  claimedAt: string | null
  revokedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface AiChatClaimUseKeyInput {
  locale?: AiChatLocale
  useKey: string
}

export interface AiChatClaimPublicSessionInput {
  consentAccepted: boolean
  ipAddress: string
  locale?: AiChatLocale
  userAgent?: string | null
}

export interface AiChatPublicSessionClaimResult {
  consentRecordedAt: string
  policyVersion: string
  session: AiChatSessionSnapshot
  turnsPerDay: number
  useKey: string
}

export interface AiChatCloseSessionInput {
  sessionId: string
  useKey: string
}

export interface AiChatSummarySnapshot {
  generatedAt: string
  keywords: string[]
  stage: AiChatSummaryStage
  summary: string
  visitorFocus?: string
  aiClosing?: string
}

export interface AiChatProjectCardBlock {
  type: 'project_card'
  title: string
  subtitle: string
  period: string
  summary: string
  technologies: string[]
  highlights: string[]
}

export interface AiChatExperienceCardBlock {
  type: 'experience_card'
  title: string
  subtitle: string
  period: string
  summary: string
  technologies: string[]
  highlights: string[]
}

export interface AiChatSystemNoticeBlock {
  type: 'system_notice'
  tone: 'info' | 'warning' | 'success'
  text: string
}

export interface AiChatSummaryBlock {
  type: 'summary'
  stage: AiChatSummaryStage
  title: string
  summary: string
  keywords: string[]
}

export interface AiChatArticleCardBlock {
  type: 'article_card'
  title: string
  summary: string
  url?: string
  keywords: string[]
}

export interface AiChatMediaCardBlock {
  type: 'media_card'
  title: string
  description: string
  url: string
  thumbnailUrl?: string
}

export interface AiChatHobbyCardBlock {
  type: 'hobby_card'
  title: string
  description: string
  url?: string
  keywords: string[]
}

export interface AiChatTextBlock {
  type: 'text'
  text: string
}

export type AiChatMessageBlock =
  | AiChatTextBlock
  | AiChatProjectCardBlock
  | AiChatExperienceCardBlock
  | AiChatArticleCardBlock
  | AiChatMediaCardBlock
  | AiChatHobbyCardBlock
  | AiChatSystemNoticeBlock
  | AiChatSummaryBlock

export interface AiChatMessageSnapshot {
  id: string
  role: AiChatMessageRole
  content: string
  turnIndex: number
  answerBlocks: AiChatMessageBlock[]
  citations: RagAskCitation[]
  createdAt: string
}

export interface AiChatSessionSnapshot {
  sessionId: string
  lead: AiChatLeadSummary
  locale: AiChatLocale
  status: AiChatSessionStatus
  turnCount: number
  remainingTurns: number
  useKeyStatus: AiChatUseKeyStatus
  messages: AiChatMessageSnapshot[]
  interimSummary: AiChatSummarySnapshot | null
  finalSummary: AiChatSummarySnapshot | null
  createdAt: string
  updatedAt: string
  closedAt: string | null
}

export interface AiChatSessionListItem {
  id: string
  leadDisplayName: string
  companyName: string
  status: AiChatSessionStatus
  turnCount: number
  locale: AiChatLocale
  updatedAt: string
  createdAt: string
  hasFinalSummary: boolean
}

export interface AiChatAskMessageInput {
  content: string
  locale?: AiChatLocale
  sessionId: string
  useKey: string
}

export type AiChatStreamEventType =
  | 'start'
  | 'token'
  | 'citation'
  | 'block'
  | 'summary'
  | 'done'
  | 'error'

export interface AiChatStreamStartEvent {
  event: 'start'
  data: {
    assistantMessageId: string
    remainingTurns: number
    sessionId: string
    turnCount: number
  }
}

export interface AiChatStreamTokenEvent {
  event: 'token'
  data: {
    text: string
  }
}

export interface AiChatStreamCitationEvent {
  event: 'citation'
  data: RagAskCitation
}

export interface AiChatStreamBlockEvent {
  event: 'block'
  data: AiChatMessageBlock
}

export interface AiChatStreamSummaryEvent {
  event: 'summary'
  data: AiChatSummarySnapshot
}

export interface AiChatStreamDoneEvent {
  event: 'done'
  data: {
    session: AiChatSessionSnapshot
  }
}

export interface AiChatStreamErrorEvent {
  event: 'error'
  data: {
    message: string
  }
}

export type AiChatStreamEvent =
  | AiChatStreamStartEvent
  | AiChatStreamTokenEvent
  | AiChatStreamCitationEvent
  | AiChatStreamBlockEvent
  | AiChatStreamSummaryEvent
  | AiChatStreamDoneEvent
  | AiChatStreamErrorEvent

export interface AiChatAnswerGenerationResult {
  answer: string
  blocks: AiChatMessageBlock[]
  citations: RagAskCitation[]
}
