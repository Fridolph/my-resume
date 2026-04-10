import { describe, expect, it } from 'vitest'

import { publishedResumeFixture } from './fixture'
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

  it('should build radar and pie options from real skill item counts', () => {
    const groups = rankSkillGroups(
      normalizeSkillGroups(publishedResumeFixture.resume.skills),
      'zh',
    )

    const radar = buildRadarChartOption(groups, 'zh', 'light')
    const pie = buildPieChartOption(groups, 'zh', 'light')

    expect(Array.isArray(radar.series)).toBe(true)
    expect(Array.isArray(pie.series)).toBe(true)
    expect(JSON.stringify(radar)).toContain('"value":[4,3]')
    expect(JSON.stringify(pie)).not.toContain('总条目数')
  })
})
