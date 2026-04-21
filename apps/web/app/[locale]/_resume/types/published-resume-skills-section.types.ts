import type { ComponentType } from 'react'

import type {
  ResumeLocale,
  ResumeSkillGroup,
} from '@shared/published-resume/types/published-resume.types'
import type { SkillChartOption } from '../published-resume-skills-utils'

/**
 * 公开站技能分节组件入参。
 */
export interface PublishedResumeSkillsSectionProps {
  locale: ResumeLocale
  skills: ResumeSkillGroup[]
}

/**
 * 技能区展示模式。
 */
export type SkillViewMode = 'structure' | 'chart'

/**
 * 技能图表模式。
 */
export type SkillChartMode = 'radar' | 'pie'

/**
 * 技能图表渲染器类型。
 */
export type SkillChartRenderer = ComponentType<{
  ariaLabel: string
  option: SkillChartOption
}>

/**
 * 支持空闲回调 API 的 window 扩展类型。
 */
export type IdleAwareWindow = Window &
  typeof globalThis & {
    cancelIdleCallback?: (handle: number) => void
    requestIdleCallback?: (callback: IdleRequestCallback) => number
  }
