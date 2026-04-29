import { describe, expect, it } from 'vitest'

import { createEmptyStandardResume } from '../../../../resume/domain/standard-resume'
import { patchResumeImportCoreStrengthsFromText } from '../utils/resume-import-core-strengths'

describe('resume import core strengths helper', () => {
  it('patches highlights from the markdown core strengths section when provider omits them', () => {
    const result = patchResumeImportCoreStrengthsFromText({
      resume: createEmptyStandardResume(),
      text: [
        '## 基本信息',
        '简介',
        '## 核心竞争力',
        '- **Node.js 后端经验**：7 年 Web 与服务端开发经验',
        '- **工程化交付能力**：熟悉 Monorepo、CI/CD、Docker',
        '## 教育经历',
        '学校',
      ].join('\n'),
    })

    expect(result.resume.highlights).toHaveLength(2)
    expect(result.resume.highlights.map((item) => item.title.zh)).toEqual(
      expect.arrayContaining(['Node.js 后端经验', '工程化交付能力']),
    )
    expect(result.repairMessages.join('\n')).toContain('核心竞争力')
  })

  it('does not override provider highlights when they already exist', () => {
    const resume = createEmptyStandardResume()
    resume.highlights = [
      {
        title: { zh: '已有亮点', en: '' },
        description: { zh: '由 provider 识别', en: '' },
      },
    ]

    const result = patchResumeImportCoreStrengthsFromText({
      resume,
      text: '## 核心竞争力\n- **Node.js 后端经验**：7 年经验',
    })

    expect(result.resume.highlights).toHaveLength(1)
    expect(result.resume.highlights[0]?.title.zh).toBe('已有亮点')
    expect(result.repairMessages).toEqual([])
  })
})
