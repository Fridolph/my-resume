import type { ComponentType } from 'react'

import type {
  ResumeLocale,
  ResumeSkillGroup,
} from '@shared/published-resume/types/published-resume.types'
import type { SkillChartOption } from '../published-resume-skills-utils'

export interface PublishedResumeSkillsSectionProps {
  locale: ResumeLocale
  skills: ResumeSkillGroup[]
}

export type SkillViewMode = 'structure' | 'chart'
export type SkillChartMode = 'radar' | 'pie'
export type SkillChartRenderer = ComponentType<{
  ariaLabel: string
  option: SkillChartOption
}>

export type IdleAwareWindow = Window &
  typeof globalThis & {
    cancelIdleCallback?: (handle: number) => void
    requestIdleCallback?: (callback: IdleRequestCallback) => number
  }
