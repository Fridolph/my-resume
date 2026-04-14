import { Inject, Injectable } from '@nestjs/common'
import PDFDocument from 'pdfkit'

import { ResumeLocale, StandardResume } from './domain/standard-resume'
import { ResumeMarkdownExportService } from './resume-markdown-export.service'
import { resolvePdfFontPath } from './resume-pdf-fonts'

function normalizeInlineMarkdown(value: string): string {
  return value
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\[(.+?)\]\((.+?)\)/g, '$1 ($2)')
}

@Injectable()
export class ResumePdfExportService {
  constructor(
    @Inject(ResumeMarkdownExportService)
    private readonly resumeMarkdownExportService: ResumeMarkdownExportService,
  ) {}

  async render(
    resume: StandardResume,
    locale: ResumeLocale,
  ): Promise<Buffer<ArrayBufferLike>> {
    const markdown = this.resumeMarkdownExportService.render(resume, locale)
    const cjkFontPath = resolvePdfFontPath(locale)

    return new Promise((resolve, reject) => {
      const document = new PDFDocument({
        margin: 48,
        size: 'A4',
      })
      const chunks: Buffer[] = []

      document.on('data', (chunk: Buffer | Uint8Array | string) => {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array))
      })
      document.on('end', () => resolve(Buffer.concat(chunks)))
      document.on('error', reject)

      if (cjkFontPath) {
        document.font(cjkFontPath)
      }

      document.fontSize(12)

      markdown.split('\n').forEach((line, index) => {
        const trimmedLine = line.trim()

        if (!trimmedLine) {
          document.moveDown(0.4)
          return
        }

        if (trimmedLine.startsWith('# ')) {
          document.fontSize(20).text(normalizeInlineMarkdown(trimmedLine.slice(2)))
          document.moveDown(0.6)
          document.fontSize(12)
          return
        }

        if (trimmedLine.startsWith('## ')) {
          document.fontSize(16).text(normalizeInlineMarkdown(trimmedLine.slice(3)))
          document.moveDown(0.4)
          document.fontSize(12)
          return
        }

        if (trimmedLine.startsWith('### ')) {
          document.fontSize(13).text(normalizeInlineMarkdown(trimmedLine.slice(4)))
          document.moveDown(0.2)
          document.fontSize(12)
          return
        }

        if (trimmedLine.startsWith('- ')) {
          document.text(`• ${normalizeInlineMarkdown(trimmedLine.slice(2))}`, {
            indent: 14,
          })
          return
        }

        document.text(normalizeInlineMarkdown(trimmedLine))

        if (index < markdown.length - 1) {
          document.moveDown(0.2)
        }
      })

      document.end()
    })
  }
}
