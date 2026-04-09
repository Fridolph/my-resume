import { describe, expect, it, vi } from 'vitest'

import type { Response } from 'express'

import { createExampleStandardResume } from '../domain/standard-resume'
import { ResumeController } from '../resume.controller'

function createResponseMock() {
  return {
    setHeader: vi.fn(),
    status: vi.fn().mockReturnThis(),
    send: vi.fn(),
  } as unknown as Response
}

describe('ResumeController cache headers', () => {
  const resume = createExampleStandardResume()
  const publicationService = {
    getPublished: vi.fn().mockResolvedValue({
      status: 'published',
      publishedAt: '2026-04-09T09:00:00.000Z',
      resume,
    }),
    getDraft: vi.fn().mockResolvedValue({
      status: 'draft',
      updatedAt: '2026-04-09T09:00:00.000Z',
      resume,
    }),
    updateDraft: vi.fn(),
    publish: vi.fn(),
  }
  const markdownExportService = {
    render: vi.fn().mockReturnValue('# resume'),
  }
  const pdfExportService = {
    render: vi.fn().mockResolvedValue(Buffer.from('pdf')),
  }

  const controller = new ResumeController(
    publicationService as never,
    markdownExportService as never,
    pdfExportService as never,
  )

  it('should mark published summary as cacheable and vary by cookie', async () => {
    const response = createResponseMock()

    const result = await controller.getPublishedResumeSummary(
      undefined,
      'my-resume-locale=en',
      response,
    )

    expect(result.resume.meta.locale).toBe('en')
    expect(response.setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      'public, max-age=60, stale-while-revalidate=300',
    )
    expect(response.setHeader).toHaveBeenCalledWith('Vary', 'Cookie, Accept-Encoding')
  })

  it('should mark draft payloads as private and non-cacheable', async () => {
    const response = createResponseMock()

    const result = await controller.getDraftResumeSummary(undefined, undefined, response)

    expect(result.status).toBe('draft')
    expect(response.setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      'private, no-store, no-cache, max-age=0, must-revalidate',
    )
    expect(response.setHeader).toHaveBeenCalledWith('Pragma', 'no-cache')
    expect(response.setHeader).toHaveBeenCalledWith('Vary', 'Authorization, Cookie')
  })
})
