import type { ResumeLocale } from '../published-resume/types/published-resume.types'

export interface PublicSiteHeaderProps {
  apiBaseUrl?: string
  deferActionsUntilIdle?: boolean
  locale: ResumeLocale
}

export interface PublicSiteHeaderActionsProps {
  apiBaseUrl: string
  locale: ResumeLocale
}

export interface IdleWindowCallbacks {
  cancelIdleCallback?: (handle: number) => void
  requestIdleCallback?: (callback: () => void) => number
}
