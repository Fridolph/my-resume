'use client'

import { describe, expect, it, vi } from 'vitest'

vi.mock('@i18n/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

import {
  buildPerceivedResumeImportSteps,
} from '../components/resume-import-panel'
import type { AiResumeImportJob } from '../types/ai-workbench.types'

function createRunningAiGeneratingJob(
  overrides: Partial<AiResumeImportJob> = {},
): AiResumeImportJob {
  return {
    jobId: 'resume-import-job-001',
    status: 'running',
    currentStage: 'ai_generating',
    steps: [
      {
        stage: 'accepted',
        label: '已接收上传请求',
        status: 'completed',
        summary: '请求已接收',
      },
      {
        stage: 'extracting',
        label: '正在提取文件文本',
        status: 'completed',
        summary: '文本提取完成',
      },
      {
        stage: 'text_validating',
        label: '正在校验文本边界',
        status: 'completed',
        summary: '文本边界校验通过',
      },
      {
        stage: 'raw_archiving',
        label: '正在备份提取原文',
        status: 'completed',
        summary: '原文摘要已保存',
      },
      {
        stage: 'format_normalizing',
        label: '正在整理输入格式',
        status: 'completed',
        summary: '规则层整理完成',
      },
      {
        stage: 'safety_filtering',
        label: '正在生成输入治理报告',
        status: 'completed',
        summary: '输入治理报告已生成',
      },
      {
        stage: 'ai_generating',
        label: '正在调用 AI 生成候选草稿',
        status: 'running',
        summary: 'AI 正在生成候选草稿',
      },
      {
        stage: 'json_parsing',
        label: '正在解析 AI JSON 输出',
        status: 'pending',
      },
    ],
    createdAt: '2026-04-29T05:38:01.630Z',
    updatedAt: '2026-04-29T05:38:01.630Z',
    elapsedMs: 0,
    ...overrides,
  }
}

describe('buildPerceivedResumeImportSteps', () => {
  it('gradually reveals fast pre-AI steps during the first 30 seconds', () => {
    const job = createRunningAiGeneratingJob()

    const initialSteps = buildPerceivedResumeImportSteps(job, 0)
    const tenSecondSteps = buildPerceivedResumeImportSteps(job, 10_000)

    expect(initialSteps[0]).toMatchObject({
      stage: 'accepted',
      status: 'completed',
      summary: '请求已接收',
    })
    expect(initialSteps[1]).toMatchObject({
      stage: 'extracting',
      status: 'pending',
    })
    expect(initialSteps[1]).not.toHaveProperty('summary')
    expect(tenSecondSteps.slice(0, 3).map((step) => step.status)).toEqual([
      'completed',
      'completed',
      'completed',
    ])
    expect(tenSecondSteps[3]).toMatchObject({
      stage: 'raw_archiving',
      status: 'pending',
    })
    expect(tenSecondSteps[3]).not.toHaveProperty('summary')
  })

  it('shows the real timeline after the perceived progress window', () => {
    const job = createRunningAiGeneratingJob()

    const steps = buildPerceivedResumeImportSteps(job, 30_000)

    expect(steps).toEqual(job.steps)
  })

  it('does not delay terminal states', () => {
    const completedJob = createRunningAiGeneratingJob({
      status: 'completed',
      currentStage: 'completed',
      resultId: 'resume-import-result-001',
    })
    const failedJob = createRunningAiGeneratingJob({
      status: 'failed',
      currentStage: 'failed',
      error: {
        message: 'AI 识别失败',
      },
    })

    expect(buildPerceivedResumeImportSteps(completedJob, 0)).toEqual(completedJob.steps)
    expect(buildPerceivedResumeImportSteps(failedJob, 0)).toEqual(failedJob.steps)
  })
})
