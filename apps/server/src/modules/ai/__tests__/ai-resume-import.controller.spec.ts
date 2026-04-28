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
    expect(controller.getResult('resume-import-001')).toEqual({
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
})
