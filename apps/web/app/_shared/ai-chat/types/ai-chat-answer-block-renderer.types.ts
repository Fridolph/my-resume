import type { ReactNode } from 'react'

import type { AiChatMessageBlock } from '@my-resume/api-client'

export type AiChatAnswerBlockRendererLocale = 'zh' | 'en'

export interface AiChatAnswerBlockRendererProps {
  blocks: AiChatMessageBlock[]
  locale: AiChatAnswerBlockRendererLocale
}

export interface BlockShellProps {
  children: ReactNode
  tone?: 'emerald' | 'sky' | 'amber' | 'violet' | 'zinc'
}
