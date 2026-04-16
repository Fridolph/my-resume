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

  it('should keep expected content in the exported pdf', async () => {
    const resume = createExampleStandardResume()
    const pdfBuffer = await service.render(resume, 'zh')
    const parser = new PDFParse({ data: pdfBuffer })

    try {
      const result = await parser.getText()

      expect(result.text.length).toBeGreaterThan(80)
      expect(result.text).toContain('Email: 249121486@qq.com')
      expect(result.text).toContain('Phone: 16602835945')
      expect(result.text).not.toContain('在线简历:')
      expect(result.text).not.toContain('GitHub:')
      expect(result.text).not.toContain('技术博客:')
      expect(result.text).not.toContain('95/100')

      const hasReadableChinese = /[\u4e00-\u9fff]/.test(result.text)

      if (hasReadableChinese) {
        expect(result.text).toContain('付寅生')
        expect(result.text).toContain('基本信息')
        expect(result.text).toContain('核心项目经历')
        expect(result.text).toContain('专业技能')
        expect(result.text).toContain('前端核心能力')
        expect(result.text).toContain('教育经历')
        expect(result.text).toContain('职位与类型')
      }
    } finally {
      await parser.destroy()
    }
  })
})
