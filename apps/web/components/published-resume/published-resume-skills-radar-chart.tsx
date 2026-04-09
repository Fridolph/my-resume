'use client'

import { RadarChart } from 'echarts/charts'
import { AriaComponent, RadarComponent, TooltipComponent } from 'echarts/components'
import { use } from 'echarts/core'
import { SVGRenderer } from 'echarts/renderers'

import type { SkillChartOption } from './published-resume-skills-utils'
import { PublishedResumeSkillsChartSurface } from './published-resume-skills-chart-surface'

use([RadarChart, TooltipComponent, RadarComponent, AriaComponent, SVGRenderer])

export function PublishedResumeSkillsRadarChart({
  ariaLabel,
  option,
}: {
  ariaLabel: string
  option: SkillChartOption
}) {
  return <PublishedResumeSkillsChartSurface ariaLabel={ariaLabel} option={option} />
}
