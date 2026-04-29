import { describe, expect, it } from 'vitest'

import { createExampleStandardResume } from '../../../../resume/domain/standard-resume'
import { buildResumeImportModuleContents } from '../utils/resume-import-content'

describe('resume import content helpers', () => {
  it('aggregates repetitive repair warnings into readable module-level reminders', () => {
    const resume = createExampleStandardResume()
    const contents = buildResumeImportModuleContents(resume, resume, [
      'AI 输出已自动修正：已将 experiences[0].companyName 兜底为空 LocalizedText',
      'AI 输出已自动修正：已将 experiences[0].role 兜底为空 LocalizedText',
      'AI 输出已自动修正：已将 experiences[1].companyName 兜底为空 LocalizedText',
      'AI 输出已自动修正：已将 experiences[1].role 兜底为空 LocalizedText',
      'AI 输出已自动修正：已自动修复 experiences[0].highlights[0]：string -> { zh, en }',
      'AI 输出已自动修正：已自动修复 experiences[0].highlights[1]：string -> { zh, en }',
      '基本信息中的联系方式不完整，请手动核对。',
    ])
    const experienceWarnings =
      contents.find((item) => item.module === 'experiences')?.warnings ?? []
    const profileWarnings =
      contents.find((item) => item.module === 'profile')?.warnings ?? []

    expect(experienceWarnings).toHaveLength(2)
    expect(experienceWarnings).toEqual(
      expect.arrayContaining([
        expect.stringContaining('工作经历中 2 条记录'),
        expect.stringContaining('2 条亮点'),
      ]),
    )
    expect(experienceWarnings.join('\n')).toContain('AI 输出已自动修正')
    expect(profileWarnings).toEqual(
      expect.arrayContaining([expect.stringContaining('联系方式不完整')]),
    )
  })
})
