import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { parseMockResumeFromMarkdown } from '../utils/resume-import-markdown-parser'

describe('parseMockResumeFromMarkdown', () => {
  it('parses lifeiyu-style markdown into semantic StandardResume sections', () => {
    const sample = readFileSync(
      join(process.cwd(), '../../public/lifeiyu-mock-zh.md'),
      'utf8',
    )

    const resume = parseMockResumeFromMarkdown(sample)

    expect(resume.profile.fullName.zh).toBe('厉飞雨')
    expect(resume.profile.email).toBe('lifeiyu.mock@example.com')
    expect(resume.education).toHaveLength(1)
    expect(resume.experiences).toHaveLength(4)
    expect(resume.projects).toHaveLength(4)
    expect(resume.skills).toHaveLength(6)
    expect(resume.highlights).toHaveLength(5)
    expect(resume.projects[0]?.technologies.length).toBeGreaterThan(0)
  })
})
