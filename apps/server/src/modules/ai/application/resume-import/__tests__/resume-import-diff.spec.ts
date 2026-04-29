import { describe, expect, it } from 'vitest'

import { createExampleStandardResume } from '../../../../resume/domain/standard-resume'
import {
  buildResumeImportModuleDiffs,
  isResumeImportModuleChanged,
} from '../utils/resume-import-diff'

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

describe('resume import diff helpers', () => {
  it('marks changed, unchanged, and warning modules for the result dashboard', () => {
    const currentResume = createExampleStandardResume()
    const candidateResume = clone(currentResume)
    candidateResume.skills = []

    const diffs = buildResumeImportModuleDiffs(currentResume, candidateResume, [
      '专业技能模块偏少，建议回填前补充或调整。',
    ])
    const profileDiff = diffs.find((item) => item.module === 'profile')
    const skillsDiff = diffs.find((item) => item.module === 'skills')

    expect(isResumeImportModuleChanged(currentResume, candidateResume, 'skills')).toBe(
      true,
    )
    expect(profileDiff?.status).toBe('unchanged')
    expect(skillsDiff?.status).toBe('warning')
    expect(skillsDiff?.entries[0]?.warning).toContain('专业技能')
  })
})
