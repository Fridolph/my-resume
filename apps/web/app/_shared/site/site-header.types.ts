import type { ComponentProps } from 'react'

import type { ResumeLocale } from '../published-resume/types/published-resume.types'

export interface PublicSiteHeaderProps {
  apiBaseUrl?: string
  deferActionsUntilIdle?: boolean
  locale: ResumeLocale
}

export type PublicSiteHeaderActionsProps = ComponentProps<
  typeof import('./public-site-header-actions')['PublicSiteHeaderActions']
>

export interface IdleWindowCallbacks {
  cancelIdleCallback?: (handle: number) => void
  requestIdleCallback?: (callback: () => void) => number
}
