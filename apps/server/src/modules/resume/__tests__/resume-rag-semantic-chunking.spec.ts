import { describe, expect, it } from 'vitest'

import { buildResumeRagSemanticChunks } from '../application/services/resume-rag-semantic-chunking'
import { createExampleStandardResume } from '../domain/standard-resume'

describe('buildResumeRagSemanticChunks', () => {
  it('should split resume core into semantic chunks with retrieval metadata', () => {
    const chunks = buildResumeRagSemanticChunks(createExampleStandardResume(), 'zh')

    expect(chunks.length).toBeGreaterThan(1)
    expect(chunks[0]).toMatchObject({
      section: 'profile',
      subsectionKey: 'profile',
      entityType: 'profile_summary',
      chunkIndex: 0,
      chunkCount: chunks.length,
    })
    expect(chunks[0]?.content).toContain('付寅生')
    expect(chunks[0]?.contentHash).toMatch(/^[a-f0-9]{64}$/)

    expect(chunks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          section: 'skills',
          entityType: 'skill_group',
        }),
        expect.objectContaining({
          section: 'work_experience',
          entityType: 'experience_summary',
        }),
        expect.objectContaining({
          section: 'projects',
          entityType: 'project_summary',
        }),
        expect.objectContaining({
          section: 'core_strengths',
          entityType: 'core_strength',
        }),
      ]),
    )
  })

  it('should build stable keys and localized content for the selected locale', () => {
    const resume = createExampleStandardResume()

    const firstRun = buildResumeRagSemanticChunks(resume, 'en')
    const secondRun = buildResumeRagSemanticChunks(resume, 'en')
    const projectChunk = firstRun.find((chunk) => chunk.section === 'projects')

    expect(firstRun.map((chunk) => chunk.stableKey)).toEqual(
      secondRun.map((chunk) => chunk.stableKey),
    )
    expect(projectChunk?.content).toContain('TypeScript')
    expect(projectChunk?.content).not.toContain('付寅生')
    expect(
      firstRun.every((chunk) => chunk.chunkCount === firstRun.length && chunk.tags.length > 0),
    ).toBe(true)
  })
})
