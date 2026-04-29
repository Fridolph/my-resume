import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'

import { ResumePublicationService } from '../../resume/resume-publication.service'
import {
  createExampleStandardResume,
  type StandardResume,
} from '../../resume/domain/standard-resume'
import { AiService } from '../application/services/ai.service'
import { AiUsageRecordService } from '../application/services/ai-usage-record.service'
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

function createAiUsageRecordService() {
  return {
    recordSuccess: vi.fn().mockResolvedValue({ id: 'usage-resume-import-001' }),
    recordFailure: vi.fn().mockResolvedValue({ id: 'usage-resume-import-failed' }),
    findResumeImportSnapshotByResultId: vi.fn().mockResolvedValue(null),
    updateResumeImportSnapshot: vi.fn().mockResolvedValue(undefined),
  } as unknown as AiUsageRecordService & {
    recordSuccess: ReturnType<typeof vi.fn>
    recordFailure: ReturnType<typeof vi.fn>
    findResumeImportSnapshotByResultId: ReturnType<typeof vi.fn>
    updateResumeImportSnapshot: ReturnType<typeof vi.fn>
  }
}

function createStructuredResumePayload() {
  return {
    summary: '已识别完整候选草稿',
    warnings: [],
    formatReport: {
      summary: '结构化识别已完成输入治理。',
      rawCharCount: 0,
      formattedCharCount: 0,
      keptLineCount: 0,
      discardedLineCount: 0,
      discardedItems: [],
      safetyFlags: [],
      warnings: [],
    },
    resume: {
      meta: {
        slug: 'standard-resume',
        version: 1,
        defaultLocale: 'zh',
        locales: ['zh', 'en'],
      },
      profile: {
        fullName: { zh: '厉飞雨', en: '' },
        headline: { zh: 'AI 全栈工程师', en: '' },
        summary: { zh: '具备 AI 工程化经验', en: '' },
        location: { zh: '杭州', en: '' },
        email: 'lifeiyu@example.com',
        phone: '13800000000',
        website: '',
        hero: {
          frontImageUrl: '',
          backImageUrl: '',
          linkUrl: '',
          slogans: [{ zh: '把 AI 能力做成真实产品', en: '' }],
        },
        links: [],
        interests: [],
      },
      education: [
        {
          schoolName: { zh: '四川大学', en: '' },
          degree: { zh: '本科', en: '' },
          fieldOfStudy: { zh: '软件工程', en: '' },
          startDate: '2014-09',
          endDate: '2018-06',
          location: { zh: '成都', en: '' },
          highlights: [{ zh: '主修软件工程', en: '' }],
        },
      ],
      experiences: [
        {
          companyName: { zh: '成都示例科技有限公司', en: '' },
          role: { zh: '全栈工程师', en: '' },
          employmentType: { zh: '全职', en: '' },
          startDate: '2021-01',
          endDate: '2024-12',
          location: { zh: '成都', en: '' },
          summary: { zh: '负责 AI 应用工程化交付。', en: '' },
          highlights: [{ zh: '落地 RAG 与管理后台能力。', en: '' }],
          technologies: ['TypeScript', 'Node.js'],
        },
      ],
      projects: [
        {
          name: { zh: 'Agent Knowledge Lab', en: '' },
          role: { zh: '负责人', en: '' },
          startDate: '2024-01',
          endDate: '2024-12',
          summary: { zh: '面向知识库问答的 AI 项目。', en: '' },
          coreFunctions: { zh: 'RAG 检索、引用追踪、管理后台。', en: '' },
          highlights: [{ zh: '完成从导入到问答的闭环。', en: '' }],
          technologies: ['RAG', 'Milvus'],
          links: [],
        },
      ],
      skills: [
        {
          name: { zh: 'AI 工程化', en: '' },
          keywords: [{ zh: 'RAG', en: '' }, { zh: 'LLM', en: '' }],
        },
        {
          name: { zh: '前端工程', en: '' },
          keywords: [{ zh: 'React', en: '' }, { zh: 'Vue', en: '' }],
        },
        {
          name: { zh: '后端工程', en: '' },
          keywords: [{ zh: 'NestJS', en: '' }, { zh: 'Node.js', en: '' }],
        },
      ],
      highlights: [
        {
          title: { zh: 'Node.js 后端经验', en: '' },
          description: { zh: '具备复杂业务工程化经验。', en: '' },
        },
      ],
    },
  }
}

function createService(input?: {
  aiService?: AiService
  aiUsageRecordService?: AiUsageRecordService
  resumePublicationService?: ResumePublicationService
}) {
  return new ResumeImportRecognitionService(
    new FileExtractionService(),
    input?.aiService ?? createMockAiService(),
    input?.aiUsageRecordService ?? createAiUsageRecordService(),
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
    const result = await service.getResult(completedJob.resultId!)

    expect(completedJob.status).toBe('completed')
    expect(completedJob.steps.every((step) => step.status === 'completed')).toBe(true)
    expect(result.resultId).toBeTruthy()
    expect(result.fileType).toBe('md')
    expect(result.providerSummary.mode).toBe('mock')
    expect(result.sourceSnapshot?.sourceHash).toHaveLength(64)
    expect(result.formatReport?.formattedCharCount).toBeGreaterThan(500)
    expect(result.canApply).toBe(true)
    expect(result.appliedModules).toEqual([])
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
    expect(
      result.moduleContents.find((item) => item.module === 'projects'),
    ).toMatchObject({
      title: '项目经历',
      candidateItems: expect.arrayContaining([
        expect.objectContaining({
          title: 'Agent Knowledge Lab',
        }),
      ]),
    })
  })

  it('fails fast when structured stream output fails without long JSON fallback', async () => {
    const generateText = vi.fn()
    const aiService = createMockAiService({
      getProviderSummary: () => ({
        provider: 'qiniu',
        model: 'deepseek-v3',
        mode: 'openai-compatible',
      }),
      generateStructuredObjectStream: vi
        .fn()
        .mockRejectedValue(new Error('tool stream interrupted')),
      generateText,
    } as Partial<AiService>)
    const service = createService({ aiService })

    const job = service.recognize(
      createUploadInput('resume.md', '有效简历内容'.repeat(100)),
    )
    const failedJob = await waitForJob(service, job.jobId)

    expect(failedJob.status).toBe('failed')
    expect(failedJob.error?.message).toContain('AI 结构化识别失败')
    expect(failedJob.error?.message).toContain('tool stream interrupted')
    expect(generateText).not.toHaveBeenCalled()
  })

  it('uses LangChain tool-call structured stream without JSON text fallback', async () => {
    const tempLogDirectory = mkdtempSync(join(tmpdir(), 'resume-import-ai-logs-'))
    const previousLogDirectory = process.env.AI_RESUME_IMPORT_LOG_DIR
    const previousLogRaw = process.env.AI_RESUME_IMPORT_LOG_RAW
    process.env.AI_RESUME_IMPORT_LOG_DIR = tempLogDirectory
    process.env.AI_RESUME_IMPORT_LOG_RAW = 'false'
    const generateText = vi.fn()
    const generateStructuredObjectStream = vi.fn().mockResolvedValue({
      method: 'jsonMode',
      model: 'deepseek-v4-flash',
      provider: 'deepseek',
      value: createStructuredResumePayload(),
    })
    const aiService = createMockAiService({
      getProviderSummary: () => ({
        provider: 'deepseek',
        model: 'deepseek-v4-flash',
        mode: 'openai-compatible',
      }),
      generateStructuredObjectStream,
      generateText,
    } as Partial<AiService>)
    const service = createService({ aiService })

    try {
      const job = service.recognize(
        createUploadInput('resume.md', '有效简历内容'.repeat(100)),
      )
      const completedJob = await waitForJob(service, job.jobId)
      const result = await service.getResult(completedJob.resultId!)

      expect(completedJob.status).toBe('completed')
      expect(generateStructuredObjectStream).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'jsonMode',
          schemaName: 'ResumeImportRecognitionPayload',
        }),
      )
      expect(generateText).not.toHaveBeenCalled()
      expect(result.moduleStats).toMatchObject({
        education: 1,
        projects: 1,
        skills: 3,
        highlights: 1,
      })
      expect(result.warnings.join('\n')).not.toContain('教育经历未识别到内容')
      expect(result.warnings.join('\n')).not.toContain('项目经历未识别到内容')

      const logFile = readFileSync(
        join(tempLogDirectory, `${new Date().toISOString().slice(0, 10)}.resume-import.ndjson`),
        'utf8',
      )
      expect(logFile).toContain('"langChainSucceeded":true')
      expect(logFile).toContain('"moduleStats"')
      expect(logFile).not.toContain('Authorization')
    } finally {
      if (typeof previousLogDirectory === 'string') {
        process.env.AI_RESUME_IMPORT_LOG_DIR = previousLogDirectory
      } else {
        delete process.env.AI_RESUME_IMPORT_LOG_DIR
      }

      if (typeof previousLogRaw === 'string') {
        process.env.AI_RESUME_IMPORT_LOG_RAW = previousLogRaw
      } else {
        delete process.env.AI_RESUME_IMPORT_LOG_RAW
      }

      rmSync(tempLogDirectory, { force: true, recursive: true })
    }
  })

  it('repairs structured stream shorthand before schema validation', async () => {
    const generateText = vi.fn()
    const generateStructuredObjectStream = vi.fn().mockResolvedValue({
      method: 'jsonMode',
      model: 'deepseek-v4-flash',
      provider: 'deepseek',
      value: {
        summary: '已识别候选草稿',
        resume: {
          profile: {
            fullName: '厉飞雨',
            headline: 'AI 全栈工程师',
            summary: '具备 AI 工程化经验',
            location: '杭州',
            email: 'lifeiyu@example.com',
            phone: '13800000000',
          },
          education: [],
          experiences: [],
          projects: [],
          skills: [],
          highlights: [
            {
              title: 'Node.js 后端经验',
              description: '7 年经验',
            },
          ],
        },
      },
    })
    const aiService = createMockAiService({
      getProviderSummary: () => ({
        provider: 'deepseek',
        model: 'deepseek-v4-flash',
        mode: 'openai-compatible',
      }),
      generateStructuredObjectStream,
      generateText,
    } as Partial<AiService>)
    const service = createService({ aiService })

    const job = service.recognize(
      createUploadInput('resume.md', '有效简历内容'.repeat(100)),
    )
    const completedJob = await waitForJob(service, job.jobId)
    const schemaStep = completedJob.steps.find((step) => step.stage === 'schema_validating')

    expect(completedJob.status).toBe('completed')
    expect(generateText).not.toHaveBeenCalled()
    expect(schemaStep?.summary).toContain('结构校验通过')
    expect(schemaStep?.details?.join('\n')).toContain('fullName')
  })

  it('keeps JSON text fallback disabled for provider recognition', async () => {
    const generateText = vi.fn()
    const generateStructuredObjectStream = vi
      .fn()
      .mockRejectedValue(new Error('malformed tool args'))
    const aiService = createMockAiService({
      getProviderSummary: () => ({
        provider: 'deepseek',
        model: 'deepseek-v4-flash',
        mode: 'openai-compatible',
      }),
      generateStructuredObjectStream,
      generateText,
    } as Partial<AiService>)
    const service = createService({ aiService })

    const job = service.recognize(
      createUploadInput('resume.md', '有效简历内容'.repeat(100)),
    )
    const failedJob = await waitForJob(service, job.jobId)

    expect(failedJob.status).toBe('failed')
    expect(failedJob.error?.message).toContain('malformed tool args')
    expect(generateText).not.toHaveBeenCalled()
  })

  it('patches core strengths from source markdown when provider omits highlights', async () => {
    const sample = readFileSync(
      join(process.cwd(), '../../public/lifeiyu-mock-zh.md'),
      'utf8',
    )
    const aiService = createMockAiService({
      getProviderSummary: () => ({
        provider: 'deepseek',
        model: 'deepseek-v4-flash',
        mode: 'openai-compatible',
      }),
      generateStructuredObjectStream: vi.fn().mockResolvedValue({
        method: 'jsonMode',
        model: 'deepseek-v4-flash',
        provider: 'deepseek',
        value: {
          summary: '已识别候选草稿',
          resume: {
            profile: {
              fullName: '厉飞雨',
              headline: 'AI 全栈工程师',
              summary: '具备 AI 工程化经验',
              location: '杭州',
              email: 'lifeiyu@example.com',
              phone: '13800000000',
            },
            education: [],
            experiences: [],
            projects: [],
            skills: [],
            highlights: [],
          },
        },
      }),
    } as Partial<AiService>)
    const service = createService({ aiService })

    const job = service.recognize(createUploadInput('lifeiyu-mock-zh.md', sample))
    const completedJob = await waitForJob(service, job.jobId)
    const result = await service.getResult(completedJob.resultId!)

    expect(completedJob.status).toBe('completed')
    expect(result.moduleStats.highlights).toBe(5)
    expect(
      result.moduleContents.find((item) => item.module === 'highlights')?.candidateItems,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ title: 'Node.js 后端经验' }),
        expect.objectContaining({ title: '工程化交付能力' }),
      ]),
    )
    expect(
      completedJob.steps.find((step) => step.stage === 'schema_validating')?.details,
    ).toEqual(expect.arrayContaining([expect.stringContaining('核心竞争力')]))
  })

  it('repairs common AI shorthand fields before validating the candidate draft', async () => {
    const aiService = createMockAiService({
      getProviderSummary: () => ({
        provider: 'deepseek',
        model: 'deepseek-v4-flash',
        mode: 'openai-compatible',
      }),
      generateStructuredObjectStream: vi.fn().mockResolvedValue({
        method: 'jsonMode',
        model: 'deepseek-v4-flash',
        provider: 'deepseek',
        value: {
          summary: '已识别候选草稿',
          formatReport: {
            summary: 'AI 已补充输入治理报告。',
            warnings: ['AI 识别到非标准标题，已按简历模块理解。'],
            discardedItems: [
              {
                summary: '推广链接',
                reason: '疑似广告内容，未写入候选草稿。',
                riskType: 'advertisement',
              },
            ],
            safetyFlags: ['advertisement'],
          },
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
        },
      }),
    } as Partial<AiService>)
    const service = createService({ aiService })

    const job = service.recognize(
      createUploadInput('resume.md', '有效简历内容'.repeat(100)),
    )
    const completedJob = await waitForJob(service, job.jobId)
    const result = await service.getResult(completedJob.resultId!)

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
    expect(
      result.moduleContents.find((item) => item.module === 'education')?.warnings,
    ).toEqual(expect.arrayContaining([expect.stringContaining('学校已从 string 转为')]))
    expect(result.formatReport?.summary).toContain('AI 已补充输入治理报告')
    expect(result.formatReport?.warnings).toEqual(
      expect.arrayContaining([expect.stringContaining('非标准标题')]),
    )
    expect(result.formatReport?.discardedItems).toEqual(
      expect.arrayContaining([expect.objectContaining({ riskType: 'advertisement' })]),
    )
  })

  it('notifies subscribers when a recognition job reaches terminal state', async () => {
    const service = createService()
    const events: string[] = []
    const sample = readFileSync(
      join(process.cwd(), '../../public/lifeiyu-mock-zh.md'),
      'utf8',
    )
    const job = service.recognize(createUploadInput('lifeiyu-mock-zh.md', sample))
    const unsubscribe = service.subscribeToJob(job.jobId, (event, nextJob) => {
      events.push(`${event}:${nextJob.status}`)
    })
    const completedJob = await waitForJob(service, job.jobId)

    unsubscribe()

    expect(completedJob.status).toBe('completed')
    expect(events).toContain('job.completed:completed')
  })

  it('fails schema validation with readable details when repaired output is still invalid', async () => {
    const aiService = createMockAiService({
      getProviderSummary: () => ({
        provider: 'deepseek',
        model: 'deepseek-v4-flash',
        mode: 'openai-compatible',
      }),
      generateStructuredObjectStream: vi.fn().mockResolvedValue({
        method: 'jsonMode',
        model: 'deepseek-v4-flash',
        provider: 'deepseek',
        value: {
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
        },
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

  it('applies selected modules once and marks the import result as consumed', async () => {
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
    const result = await service.getResult(completedJob.resultId!)

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

    const consumedResult = await service.getResult(result.resultId)

    expect(consumedResult.canApply).toBe(false)
    expect(consumedResult.appliedModules).toEqual(['profile', 'projects'])
    expect(consumedResult.appliedAt).toBeTruthy()
    await expect(
      service.apply({
        resultId: result.resultId,
        modules: ['experiences'],
      }),
    ).rejects.toThrow('该识别结果已写回过草稿，请重新上传识别后再回填')
    expect(resumePublicationService.updateDraft).toHaveBeenCalledTimes(1)
  })

  it('records successful and failed recognition jobs in usage history', async () => {
    const aiUsageRecordService = createAiUsageRecordService()
    const service = createService({ aiUsageRecordService })
    const sample = readFileSync(
      join(process.cwd(), '../../public/lifeiyu-mock-zh.md'),
      'utf8',
    )

    const completedJob = await waitForJob(
      service,
      service.recognize(createUploadInput('lifeiyu-mock-zh.md', sample)).jobId,
    )
    const failedJob = await waitForJob(
      service,
      service.recognize(createUploadInput('resume.pdf', 'fake pdf', 'application/pdf')).jobId,
    )

    expect(completedJob.status).toBe('completed')
    expect(failedJob.status).toBe('failed')
    expect(aiUsageRecordService.recordSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        operationType: 'resume-import',
        scenario: 'resume-import',
        relatedResultId: completedJob.resultId,
        detail: expect.objectContaining({
          candidateResume: expect.any(Object),
          draftUpdatedAt: '2026-04-28T12:00:00.000Z',
          formattedText: expect.any(String),
          rawText: expect.stringContaining('## 基本信息'),
          sourceHash: expect.any(String),
        }),
      }),
    )
    expect(aiUsageRecordService.recordFailure).toHaveBeenCalledWith(
      expect.objectContaining({
        operationType: 'resume-import',
        scenario: 'resume-import',
        errorMessage: expect.stringContaining('第一版仅支持上传 md/txt'),
      }),
    )
  })
})
