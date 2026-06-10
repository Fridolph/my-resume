import type {
  ResumeLocale,
  ResumePublishedSnapshot,
} from '@shared/published-resume/types/published-resume.types'

export type { ResumeLocale }

export type IntroTopicKey =
  | 'profile'
  | 'latestProject'
  | 'stack'
  | 'aiPractice'
  | 'ragAgent'
  | 'engineering'
  | 'collaboration'
  | 'hobbies'
  | 'writing'
  | 'future'

export interface IntroThreadMessage {
  content: string
  id: string
  role: 'assistant' | 'user'
}

export interface AiTalkIntroShellProps {
  apiBaseUrl?: string
  enableClientSync?: boolean
  initialLoadError?: string | null
  locale?: ResumeLocale
  publishedResume: ResumePublishedSnapshot | null
}

export interface IntroUnlockMapProps {
  completedTopics: IntroTopicKey[]
  heroImageUrl?: string | null
}
