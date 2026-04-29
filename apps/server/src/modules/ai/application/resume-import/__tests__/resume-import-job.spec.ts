import { describe, expect, it, vi } from 'vitest'

import {
  cloneResumeImportJobDetail,
  completeResumeImportJob,
  createInitialResumeImportJobDetail,
  failResumeImportJob,
  moveResumeImportJobToStage,
  updateResumeImportJobStep,
} from '../utils/resume-import-job'
import type { CachedResumeImportJob } from '../types/resume-import.types'

describe('resume import job helpers', () => {
  it('moves stages, records summaries, freezes completion elapsed time', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-28T08:00:00.000Z'))
    const detail = createInitialResumeImportJobDetail('job-1')
    const job: CachedResumeImportJob = {
      createdAt: detail.createdAt,
      detail,
    }

    vi.setSystemTime(new Date('2026-04-28T08:00:05.000Z'))
    moveResumeImportJobToStage(job, 'ai_generating')
    updateResumeImportJobStep(job, 'ai_generating', {
      summary: '正在调用 mock provider',
      details: ['provider: mock'],
    })

    expect(job.detail.currentStage).toBe('ai_generating')
    expect(job.detail.steps.find((step) => step.stage === 'extracting')?.status).toBe(
      'completed',
    )
    expect(job.detail.steps.find((step) => step.stage === 'ai_generating')?.summary).toBe(
      '正在调用 mock provider',
    )

    vi.setSystemTime(new Date('2026-04-28T08:00:10.000Z'))
    completeResumeImportJob(job, 'result-1')
    const completed = cloneResumeImportJobDetail(job)

    vi.setSystemTime(new Date('2026-04-28T08:00:30.000Z'))
    expect(completed.status).toBe('completed')
    expect(completed.resultId).toBe('result-1')
    expect(cloneResumeImportJobDetail(job).elapsedMs).toBe(10_000)
    vi.useRealTimers()
  })

  it('attaches readable failure details to the running stage', () => {
    const detail = createInitialResumeImportJobDetail('job-2')
    const job: CachedResumeImportJob = {
      createdAt: detail.createdAt,
      detail,
    }

    moveResumeImportJobToStage(job, 'schema_validating')
    failResumeImportJob(job, '结构校验失败', 'trace-1', ['education[0] 错误'])

    const failedStep = job.detail.steps.find((step) => step.stage === 'schema_validating')

    expect(job.detail.status).toBe('failed')
    expect(job.detail.error).toEqual({ message: '结构校验失败', traceId: 'trace-1' })
    expect(failedStep?.status).toBe('failed')
    expect(failedStep?.details).toEqual(['education[0] 错误'])
  })
})
