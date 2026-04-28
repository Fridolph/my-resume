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
import type { ResumeImportJobDetail } from '../application/services/resume-import-recognition.service'

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

async function waitForJob(
  service: ResumeImportRecognitionService,
  jobId: string,
): Promise<ResumeImportJobDetail> {
  for (let index = 0; index < 20; index += 1) {
    const job = service.getJob(jobId)

    if (job.status !== 'running') {
      return job
    }

    await new Promise((resolve) => setTimeout(resolve, 0))
  }

  throw new Error(`job ${jobId} did not finish`)
}

describe('ResumeImportRecognitionService', () => {
  it('starts a recognition job and fails unsupported resume file types by stage', async () => {
    const service = createService()

    const job = service.recognize(
      createUploadInput('resume.pdf', 'fake pdf', 'application/pdf'),
    )
    const failedJob = await waitForJob(service, job.jobId)

    expect(job.status).toBe('running')
    expect(failedJob.status).toBe('failed')
    expect(failedJob.error?.message).toContain('第一版仅支持上传 md/txt')
  })

  it('fails empty or too short resume text with readable job error', async () => {
    const service = createService()

    const job = service.recognize(createUploadInput('resume.md', '太短'))
    const failedJob = await waitForJob(service, job.jobId)

    expect(failedJob.status).toBe('failed')
    expect(failedJob.error?.message).toContain('简历文本过短')
  })

  it('fails oversized resume text before calling the AI provider', async () => {
    const service = createService()

    const job = service.recognize(createUploadInput('resume.md', '简历'.repeat(30_000)))
    const failedJob = await waitForJob(service, job.jobId)

    expect(failedJob.status).toBe('failed')
    expect(failedJob.error?.message).toContain('简历文本过长')
  })

  it('parses lifeiyu-style Chinese markdown into a valid candidate draft in mock mode', async () => {
    const service = createService()
    const sample = readFileSync(
      join(process.cwd(), '../../public/lifeiyu-mock-zh.md'),
      'utf8',
    )

    const job = service.recognize(createUploadInput('lifeiyu-mock-zh.md', sample))
    const completedJob = await waitForJob(service, job.jobId)
    const result = service.getResult(completedJob.resultId!)

    expect(completedJob.status).toBe('completed')
    expect(completedJob.steps.every((step) => step.status === 'completed')).toBe(true)
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

    const job = service.recognize(
      createUploadInput('resume.md', '有效简历内容'.repeat(100)),
    )
    const failedJob = await waitForJob(service, job.jobId)

    expect(failedJob.status).toBe('failed')
    expect(failedJob.error?.message).toContain('AI 未返回可解析的 JSON')
  })

  it('repairs common AI shorthand fields before validating the candidate draft', async () => {
    const aiService = createMockAiService({
      getProviderSummary: () => ({
        provider: 'deepseek',
        model: 'deepseek-v4-flash',
        mode: 'openai-compatible',
      }),
      generateText: vi.fn().mockResolvedValue({
        text: JSON.stringify({
          summary: '已识别候选草稿',
          resume: {
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
            experiences: [],
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
          },
        }),
      }),
    } as Partial<AiService>)
    const service = createService({ aiService })

    const job = service.recognize(
      createUploadInput('resume.md', '有效简历内容'.repeat(100)),
    )
    const completedJob = await waitForJob(service, job.jobId)
    const result = service.getResult(completedJob.resultId!)

    expect(completedJob.status).toBe('completed')
    expect(result.moduleStats.education).toBe(1)
    expect(result.warnings.some((warning) => warning.includes('AI 输出已自动修正'))).toBe(
      true,
    )
    expect(
      completedJob.steps.find((step) => step.stage === 'schema_validating')?.summary,
    ).toContain('自动修复')
    expect(
      completedJob.steps.find((step) => step.stage === 'diff_building')?.details,
    ).toEqual(expect.arrayContaining(['教育 1 条', '技能 1 组']))
  })

  it('fails schema validation with readable details when repaired output is still invalid', async () => {
    const aiService = createMockAiService({
      getProviderSummary: () => ({
        provider: 'deepseek',
        model: 'deepseek-v4-flash',
        mode: 'openai-compatible',
      }),
      generateText: vi.fn().mockResolvedValue({
        text: JSON.stringify({
          resume: {
            profile: {
              fullName: '厉飞雨',
              headline: 'AI 全栈工程师',
              summary: '具备 AI 工程化经验',
              location: '杭州',
            },
            education: [],
            experiences: [],
            projects: [],
            skills: [
              {
                name: 'AI 工程化',
                keywords: ['RAG'],
                proficiency: 999,
              },
            ],
            highlights: [],
          },
        }),
      }),
    } as Partial<AiService>)
    const service = createService({ aiService })

    const job = service.recognize(
      createUploadInput('resume.md', '有效简历内容'.repeat(100)),
    )
    const failedJob = await waitForJob(service, job.jobId)
    const schemaStep = failedJob.steps.find((step) => step.stage === 'schema_validating')

    expect(failedJob.status).toBe('failed')
    expect(failedJob.error?.message).toContain('修复后仍未通过结构校验')
    expect(schemaStep?.status).toBe('failed')
    expect(schemaStep?.summary).toContain('自动修复后仍未通过')
    expect(schemaStep?.details?.[0]).toContain('proficiency')
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
    const job = service.recognize(createUploadInput('lifeiyu-mock-zh.md', sample))
    const completedJob = await waitForJob(service, job.jobId)
    const result = service.getResult(completedJob.resultId!)

    await service.apply({
      resultId: result.resultId,
      modules: ['profile', 'projects'],
    })

    expect(resumePublicationService.updateDraft).toHaveBeenCalledTimes(1)
    const nextResume = resumePublicationService.updateDraft.mock
      .calls[0]?.[0] as StandardResume

    expect(nextResume.profile.fullName.zh).toBe('厉飞雨')
    expect(nextResume.projects[0]?.name.zh).toBe('Agent Knowledge Lab')
    expect(nextResume.experiences[0]?.companyName.zh).toBe(
      createExampleStandardResume().experiences[0]?.companyName.zh,
    )
  })
})
