import { BadRequestException } from '@nestjs/common'
import { describe, expect, it, vi } from 'vitest'

import {
  AiResumeImportController,
  RESUME_IMPORT_UPLOAD_MAX_BYTES,
} from '../transport/controllers/ai-resume-import.controller'

describe('AiResumeImportController', () => {
  it('keeps the resume import upload limit at 1MB for the request layer', () => {
    expect(RESUME_IMPORT_UPLOAD_MAX_BYTES).toBe(1024 * 1024)
  })

  it('rejects recognize requests without an uploaded file', async () => {
    const controller = new AiResumeImportController({
      recognize: vi.fn(),
      getJob: vi.fn(),
      getResult: vi.fn(),
      apply: vi.fn(),
    } as never)

    expect(() => controller.recognize()).toThrow(BadRequestException)
  })

  it('passes uploaded file data to the recognition service', async () => {
    const recognize = vi.fn().mockReturnValue({
      jobId: 'resume-import-job-001',
      status: 'running',
    })
    const controller = new AiResumeImportController({
      recognize,
      getJob: vi.fn(),
      getResult: vi.fn(),
      apply: vi.fn(),
    } as never)
    const file = {
      buffer: Buffer.from('# 简历'),
      originalname: 'resume.md',
      mimetype: 'text/markdown',
      size: 8,
    } as Express.Multer.File

    expect(controller.recognize(file)).toEqual({
      jobId: 'resume-import-job-001',
      status: 'running',
    })
    expect(recognize).toHaveBeenCalledWith({
      buffer: file.buffer,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    })
  })

  it('delegates result lookup and apply to the recognition service', async () => {
    const getJob = vi.fn().mockReturnValue({
      jobId: 'resume-import-job-001',
      status: 'completed',
      resultId: 'resume-import-001',
    })
    const getResult = vi.fn().mockReturnValue({
      resultId: 'resume-import-001',
    })
    const apply = vi.fn().mockResolvedValue({
      status: 'draft',
    })
    const controller = new AiResumeImportController({
      recognize: vi.fn(),
      getJob,
      getResult,
      apply,
    } as never)

    expect(controller.getJob('resume-import-job-001')).toEqual({
      jobId: 'resume-import-job-001',
      status: 'completed',
      resultId: 'resume-import-001',
    })
    await expect(controller.getResult('resume-import-001')).resolves.toEqual({
      resultId: 'resume-import-001',
    })
    await expect(
      controller.apply({
        resultId: 'resume-import-001',
        modules: ['profile'],
      }),
    ).resolves.toEqual({
      status: 'draft',
    })
    expect(apply).toHaveBeenCalledWith({
      resultId: 'resume-import-001',
      modules: ['profile'],
    })
  })

  it('streams job snapshots and terminal events as SSE', () => {
    const subscribeToJob = vi.fn((jobId, listener) => {
      listener('job.completed', {
        jobId,
        status: 'completed',
        currentStage: 'completed',
        steps: [],
        createdAt: '2026-04-28T12:00:00.000Z',
        updatedAt: '2026-04-28T12:00:05.000Z',
        elapsedMs: 5000,
        resultId: 'resume-import-001',
      })

      return vi.fn()
    })
    const controller = new AiResumeImportController({
      recognize: vi.fn(),
      getJob: vi.fn().mockReturnValue({
        jobId: 'resume-import-job-001',
        status: 'running',
        currentStage: 'ai_generating',
        steps: [],
        createdAt: '2026-04-28T12:00:00.000Z',
        updatedAt: '2026-04-28T12:00:00.000Z',
        elapsedMs: 0,
      }),
      getResult: vi.fn(),
      apply: vi.fn(),
      subscribeToJob,
    } as never)
    const writes: string[] = []
    const response = {
      status: vi.fn().mockReturnThis(),
      setHeader: vi.fn(),
      flushHeaders: vi.fn(),
      write: vi.fn((chunk: string) => {
        writes.push(chunk)
      }),
      end: vi.fn(),
      on: vi.fn(),
      writableEnded: false,
    }

    controller.streamJobEvents('resume-import-job-001', response as never)

    expect(response.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'text/event-stream; charset=utf-8',
    )
    expect(writes.join('')).toContain('event: job.snapshot')
    expect(writes.join('')).toContain('event: job.completed')
    expect(response.end).toHaveBeenCalled()
  })
})
