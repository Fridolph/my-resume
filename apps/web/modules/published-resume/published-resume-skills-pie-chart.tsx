'use client'

import { PieChart } from 'echarts/charts'
import {
  AriaComponent,
  GraphicComponent,
  LegendComponent,
  TooltipComponent,
} from 'echarts/components'
import { use } from 'echarts/core'
import { SVGRenderer } from 'echarts/renderers'

import type { SkillChartOption } from './published-resume-skills-utils'
import { PublishedResumeSkillsChartSurface } from './published-resume-skills-chart-surface'

use([
  PieChart,
  TooltipComponent,
  LegendComponent,
  GraphicComponent,
  AriaComponent,
  SVGRenderer,
])

export function PublishedResumeSkillsPieChart({
  ariaLabel,
  option,
}: {
  ariaLabel: string
  option: SkillChartOption
}) {
  return <PublishedResumeSkillsChartSurface ariaLabel={ariaLabel} option={option} />
}
