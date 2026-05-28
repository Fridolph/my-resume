import { describe, expect, it } from 'vitest'

import { createExampleStandardResume } from '../../../../resume/domain/standard-resume'
import {
  buildResumeOptimizationPrompt,
  buildResumeOptimizationSystemPrompt,
} from '../resume-optimization.prompt'

describe('resume optimization prompts', () => {
  it('builds Chinese optimization prompt with factual stability constraints', () => {
    const resume = createExampleStandardResume()
    const prompt = buildResumeOptimizationPrompt({
      resume,
      instruction: '面向前端负责人岗位优化摘要',
      locale: 'zh',
    })

    expect(buildResumeOptimizationSystemPrompt('zh')).toContain('合法 JSON')
    expect(prompt).toContain('保持事实信息稳定')
    expect(prompt).toContain('面向前端负责人岗位优化摘要')
    expect(prompt).toContain('当前可编辑上下文')
    expect(prompt).toContain('"experiences"')
    expect(prompt).toContain('"projects"')
  })

  it('builds English optimization prompt and keeps localized field rules', () => {
    const resume = createExampleStandardResume()
    const prompt = buildResumeOptimizationPrompt({
      resume,
      instruction: 'Optimize for a senior frontend role.',
      locale: 'en',
    })

    expect(buildResumeOptimizationSystemPrompt('en')).toContain('Output valid JSON only')
    expect(prompt).toContain('Keep all factual data stable')
    expect(prompt).toContain('Every localized field must include both zh and en')
    expect(prompt).toContain('Optimize for a senior frontend role.')
  })
})
