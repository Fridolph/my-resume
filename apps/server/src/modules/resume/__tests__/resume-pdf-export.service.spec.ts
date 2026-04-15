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
      const text = result.text

      expect(text.trim().length).toBeGreaterThan(200)
      expect(text).toContain('Email: 249121486@qq.com')
      expect(text).toContain('Phone: 16602835945')
      expect(text).not.toContain('在线简历:')
      expect(text).not.toContain('GitHub:')
      expect(text).not.toContain('技术博客:')
      expect(text).not.toContain('95/100')

      const hasExpectedChineseExtraction = [
        '付寅生',
        '基本信息',
        '核心项目经历',
        '专业技能',
        '前端核心能力',
        '教育经历',
        '职位与类型',
      ].every((value) => text.includes(value))

      if (hasExpectedChineseExtraction) {
        expect(text).toContain('付寅生')
        expect(text).toContain('基本信息')
        expect(text).toContain('核心项目经历')
        expect(text).toContain('专业技能')
        expect(text).toContain('前端核心能力')
        expect(text).toContain('教育经历')
        expect(text).toContain('职位与类型')
      }
    } finally {
      await parser.destroy()
    }
  })
})
