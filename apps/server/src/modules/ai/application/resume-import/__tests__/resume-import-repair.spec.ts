import { describe, expect, it } from 'vitest'

import {
  normalizeStandardResume,
  validateStandardResume,
} from '../../../../resume/domain/standard-resume'
import { repairProviderResume } from '../utils/resume-import-repair'

describe('repairProviderResume', () => {
  it('repairs common AI shorthand fields without relaxing StandardResume validation', () => {
    const repaired = repairProviderResume({
      profile: {
        fullName: '厉飞雨',
        headline: { zh: 'AI 全栈工程师' },
        summary: '具备 AI 工程化经验',
        location: '杭州',
        email: 'lifeiyu@example.com',
        phone: '13800000000',
      },
      education: [
        {
          schoolName: '四川大学',
          degree: '本科',
          fieldOfStudy: '软件工程',
          startDate: '2014-09',
          endDate: '2018-06',
          location: '成都',
          highlights: ['主修软件工程'],
        },
      ],
      experiences: 'not-array',
      projects: [],
      skills: [
        {
          name: 'AI 工程化',
          keywords: ['RAG', 'Milvus'],
        },
      ],
      highlights: [
        {
          title: 'AI 应用落地',
          description: '能够把实验能力工程化。',
        },
      ],
    })

    const normalized = normalizeStandardResume(repaired.resume)

    expect(validateStandardResume(normalized).valid).toBe(true)
    expect(normalized.education[0]?.schoolName.zh).toBe('四川大学')
    expect(normalized.skills[0]?.keywords.map((keyword) => keyword.zh)).toContain('RAG')
    expect(repaired.repairMessages.join('\n')).toEqual(
      expect.stringContaining('education[0].schoolName'),
    )
    expect(repaired.repairMessages.join('\n')).toEqual(
      expect.stringContaining('experiences 非数组'),
    )
  })
})
