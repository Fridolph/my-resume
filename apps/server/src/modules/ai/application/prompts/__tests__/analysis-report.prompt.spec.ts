import { describe, expect, it } from 'vitest'

import {
  buildAnalysisReportPrompt,
  buildAnalysisReportSystemPrompt,
} from '../analysis-report.prompt'

describe('analysis report prompts', () => {
  it('builds Chinese system and user prompts with JSON constraints', () => {
    const systemPrompt = buildAnalysisReportSystemPrompt('zh')
    const prompt = buildAnalysisReportPrompt({
      scenario: 'jd-match',
      content: '候选人熟悉 NestJS 和 React',
      locale: 'zh',
    })

    expect(systemPrompt).toContain('只输出合法 JSON')
    expect(prompt).toContain('分析场景：jd-match')
    expect(prompt).toContain('输入内容：')
    expect(prompt).toContain('候选人熟悉 NestJS 和 React')
    expect(prompt).toContain('"suggestions"')
  })

  it('builds English prompts when locale is en', () => {
    const systemPrompt = buildAnalysisReportSystemPrompt('en')
    const prompt = buildAnalysisReportPrompt({
      scenario: 'resume-review',
      content: 'Review this resume summary.',
      locale: 'en',
    })

    expect(systemPrompt).toContain('Output valid JSON only')
    expect(prompt).toContain('Scenario: resume-review')
    expect(prompt).toContain('Return JSON only')
    expect(prompt).toContain('Review this resume summary.')
  })
})
