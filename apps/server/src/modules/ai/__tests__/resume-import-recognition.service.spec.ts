import { BadGatewayException, BadRequestException } from '@nestjs/common'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'

import { ResumePublicationService } from '../../resume/resume-publication.service'
import {
  createExampleStandardResume,
  type StandardResume,
} from '../../resume/domain/standard-resume'
import { AiService } from '../application/services/ai.service'
import { FileExtractionService } from '../application/services/file-extraction.service'
import { ResumeImportRecognitionService } from '../application/services/resume-import-recognition.service'

function createUploadInput(fileName: string, text: string, mimeType = 'text/markdown') {
  const buffer = Buffer.from(text, 'utf8')

  return {
    buffer,
    originalname: fileName,
    mimetype: mimeType,
    size: buffer.byteLength,
  }
}

function createMockAiService(overrides: Partial<AiService> = {}) {
  return {
    getProviderSummary: () => ({
      provider: 'mock',
      model: 'mock-resume-import',
      mode: 'mock',
    }),
    generateText: vi.fn(),
    ...overrides,
  } as unknown as AiService
}

function createResumePublicationService(resume = createExampleStandardResume()) {
  const updateDraft = vi.fn().mockImplementation(async (nextResume: StandardResume) => ({
    status: 'draft',
    resume: nextResume,
    updatedAt: '2026-04-28T12:30:00.000Z',
  }))

  return {
    getDraft: vi.fn().mockResolvedValue({
      status: 'draft',
      resume,
      updatedAt: '2026-04-28T12:00:00.000Z',
    }),
    updateDraft,
  } as unknown as ResumePublicationService & {
    updateDraft: typeof updateDraft
  }
}

function createService(input?: {
  aiService?: AiService
  resumePublicationService?: ResumePublicationService
}) {
  return new ResumeImportRecognitionService(
    new FileExtractionService(),
    input?.aiService ?? createMockAiService(),
    input?.resumePublicationService ?? createResumePublicationService(),
  )
}

describe('ResumeImportRecognitionService', () => {
  it('rejects unsupported resume file types before extraction', async () => {
    const service = createService()

    await expect(
      service.recognize(createUploadInput('resume.pdf', 'fake pdf', 'application/pdf')),
    ).rejects.toBeInstanceOf(BadRequestException)
  })

  it('rejects empty or too short resume text', async () => {
    const service = createService()

    await expect(service.recognize(createUploadInput('resume.md', '太短'))).rejects.toThrow(
      '简历文本过短',
    )
  })

  it('rejects oversized resume text before calling the AI provider', async () => {
    const service = createService()

    await expect(
      service.recognize(createUploadInput('resume.md', '简历'.repeat(30_000))),
    ).rejects.toThrow('简历文本过长')
  })

  it('parses lifeiyu-style Chinese markdown into a valid candidate draft in mock mode', async () => {
    const service = createService()
    const sample = readFileSync(
      join(process.cwd(), '../../public/lifeiyu-mock-zh.md'),
      'utf8',
    )

    const result = await service.recognize(createUploadInput('lifeiyu-mock-zh.md', sample))

    expect(result.resultId).toBeTruthy()
    expect(result.fileType).toBe('md')
    expect(result.providerSummary.mode).toBe('mock')
    expect(result.moduleStats).toMatchObject({
      education: 1,
      experiences: 4,
      projects: 4,
      skills: 6,
      highlights: 5,
    })
    expect(result.changedModules).toEqual(
      expect.arrayContaining(['profile', 'experiences', 'projects', 'skills']),
    )
    expect(result.moduleDiffs.some((moduleDiff) => moduleDiff.status === 'changed')).toBe(
      true,
    )
  })

  it('rejects non-JSON AI provider responses', async () => {
    const aiService = createMockAiService({
      getProviderSummary: () => ({
        provider: 'qiniu',
        model: 'deepseek-v3',
        mode: 'openai-compatible',
      }),
      generateText: vi.fn().mockResolvedValue({
        text: '我不是 JSON',
      }),
    } as Partial<AiService>)
    const service = createService({ aiService })

    await expect(
      service.recognize(createUploadInput('resume.md', '有效简历内容'.repeat(100))),
    ).rejects.toBeInstanceOf(BadGatewayException)
  })

  it('applies only selected modules back to draft', async () => {
    const resumePublicationService = createResumePublicationService()
    const service = createService({
      resumePublicationService,
    })
    const sample = readFileSync(
      join(process.cwd(), '../../public/lifeiyu-mock-zh.md'),
      'utf8',
    )
    const result = await service.recognize(createUploadInput('lifeiyu-mock-zh.md', sample))

    await service.apply({
      resultId: result.resultId,
      modules: ['profile', 'projects'],
    })

    expect(resumePublicationService.updateDraft).toHaveBeenCalledTimes(1)
    const nextResume = resumePublicationService.updateDraft.mock.calls[0]?.[0] as StandardResume

    expect(nextResume.profile.fullName.zh).toBe('厉飞雨')
    expect(nextResume.projects[0]?.name.zh).toBe('Agent Knowledge Lab')
    expect(nextResume.experiences[0]?.companyName.zh).toBe(
      createExampleStandardResume().experiences[0]?.companyName.zh,
    )
  })
})
