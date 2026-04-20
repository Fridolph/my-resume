import { describe, expect, it } from 'vitest'

import { publishedResumeFixture } from '@shared/published-resume/__tests__/fixture'
import {
  buildPieChartOption,
  buildRadarChartOption,
  buildSkillCloudTokens,
  normalizeSkillGroups,
  parseSkillLine,
  rankSkillGroups,
} from '../published-resume-skills-utils'

describe('published resume skills utils', () => {
  it('should parse labeled and plain skill lines', () => {
    expect(parseSkillLine('**Vue 生态**: 熟练掌握 Vue3')).toEqual({
      label: 'Vue 生态',
      content: '熟练掌握 Vue3',
      raw: '**Vue 生态**: 熟练掌握 Vue3',
    })

    expect(parseSkillLine('Node.js：熟练使用 NestJS')).toEqual({
      label: 'Node.js',
      content: '熟练使用 NestJS',
      raw: 'Node.js：熟练使用 NestJS',
    })

    expect(parseSkillLine('TailwindCSS')).toEqual({
      label: null,
      content: 'TailwindCSS',
      raw: 'TailwindCSS',
    })
  })

  it('should build a unified skill cloud without group headers', () => {
    const groups = normalizeSkillGroups(publishedResumeFixture.resume.skills)
    const tokens = buildSkillCloudTokens(groups, 'zh')

    expect(tokens.length).toBeGreaterThan(groups.length)
    expect(tokens.some((token) => token.label === 'Vue 生态')).toBe(true)
    expect(tokens.some((token) => token.label === 'Node.js')).toBe(true)
  })

  it('should translate known chinese skill lines for english rendering', () => {
    const groups = normalizeSkillGroups(
      [
        {
          ...publishedResumeFixture.resume.skills[0],
          keywords: ['构建产物分析、懒加载与首屏性能优化'],
        },
      ],
      'en',
    )

    expect(groups[0]?.parsedKeywords[0]?.content).toBe(
      'Build artifact analysis, lazy loading, and first-screen performance optimization',
    )

    const tokens = buildSkillCloudTokens(groups, 'en')
    expect(tokens[0]?.label).toBe(
      'Build artifact analysis, lazy loading, and first-screen performance optimization',
    )
  })

  it('should build radar from proficiency scores and pie from real skill item counts', () => {
    const groups = rankSkillGroups(
      normalizeSkillGroups([
        {
          ...publishedResumeFixture.resume.skills[0],
          proficiency: 95,
        },
        {
          ...publishedResumeFixture.resume.skills[1],
          proficiency: 77,
        },
      ]),
      'zh',
    )
    const copy = {
      pieCenterTitle: '技能分布',
      pieTooltipValue: (name: string, value: number) => `${name}：${value}`,
      radarSeriesName: '技能覆盖度',
      radarTooltipValue: (name: string, value: number) => `${name}：${value}`,
    }

    const radar = buildRadarChartOption(groups, 'light', copy)
    const pie = buildPieChartOption(groups, 'light', copy)

    expect(Array.isArray(radar.series)).toBe(true)
    expect(Array.isArray(pie.series)).toBe(true)
    expect(JSON.stringify(radar)).toContain('"value":[95,77]')
    expect(JSON.stringify(radar)).toContain('"max":100')
    expect(JSON.stringify(pie)).not.toContain('总条目数')
  })
})
