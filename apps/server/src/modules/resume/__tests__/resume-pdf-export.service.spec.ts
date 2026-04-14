import { describe, expect, it } from 'vitest'
import { PDFParse } from 'pdf-parse'

import { createExampleStandardResume } from '../domain/standard-resume'
import { ResumeMarkdownExportService } from '../resume-markdown-export.service'
import { ResumePdfExportService } from '../resume-pdf-export.service'

describe('ResumePdfExportService', () => {
  const markdownService = new ResumeMarkdownExportService()
  const service = new ResumePdfExportService(markdownService)

  it('should render the published resume into a pdf buffer', async () => {
    const resume = createExampleStandardResume()

    const pdfBuffer = await service.render(resume, 'zh')

    expect(pdfBuffer.byteLength).toBeGreaterThan(100)
    expect(pdfBuffer.subarray(0, 4).toString('utf8')).toBe('%PDF')
  })

  it('should keep chinese text readable in the exported pdf', async () => {
    const resume = createExampleStandardResume()
    const pdfBuffer = await service.render(resume, 'zh')
    const parser = new PDFParse({ data: pdfBuffer })

    try {
      const result = await parser.getText()

      expect(result.text).toContain('付寅生')
      expect(result.text).toContain('个人简介')
      expect(result.text).toContain('项目经历')
    } finally {
      await parser.destroy()
    }
  })
})
