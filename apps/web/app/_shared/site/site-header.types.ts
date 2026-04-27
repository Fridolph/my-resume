import type { ComponentProps } from 'react'

import type { ResumeLocale } from '../published-resume/types/published-resume.types'

/**
 * 公开站头部组件入参。
 */
export interface PublicSiteHeaderProps {
  apiBaseUrl?: string
  deferActionsUntilIdle?: boolean
  locale: ResumeLocale
}

/**
 * 头部动作区组件入参类型。
 */
export type PublicSiteHeaderActionsProps = ComponentProps<
  typeof import('./public-site-header-actions')['PublicSiteHeaderActions']
>

/**
 * 支持空闲回调 API 的 window 扩展类型。
 */
export interface IdleWindowCallbacks {
  cancelIdleCallback?: (handle: number) => void
  requestIdleCallback?: (callback: () => void) => number
}
