import { describe, expect, it, vi } from 'vitest'

import { createExampleStandardResume } from '../domain/standard-resume'
import { ResumePdfExportService } from '../resume-pdf-export.service'

vi.mock('puppeteer', () => ({
  default: {
    launch: vi.fn().mockResolvedValue({
      close: vi.fn(),
      newPage: vi.fn().mockResolvedValue({
        close: vi.fn(),
        pdf: vi.fn().mockResolvedValue(
          Buffer.from('%PDF-mock-puppeteer-output'),
        ),
        setContent: vi.fn(),
      }),
    }),
  },
}))

describe('ResumePdfExportService', () => {
  const service = new ResumePdfExportService()

  it('should render the published resume into a pdf buffer', async () => {
    const resume = createExampleStandardResume()
    const pdfBuffer = await service.render(resume, 'zh')

    expect(pdfBuffer.byteLength).toBeGreaterThan(10)
    expect(pdfBuffer.toString('utf8')).toContain('%PDF')
  })

  it('should render English locale as well', async () => {
    const resume = createExampleStandardResume()
    const pdfBuffer = await service.render(resume, 'en')

    expect(pdfBuffer.byteLength).toBeGreaterThan(10)
  })
})
