import { Inject, Injectable } from '@nestjs/common'
import PDFDocument from 'pdfkit'

import { ResumeLocale, StandardResume } from '../../domain/standard-resume'
import { ResumeMarkdownExportService } from './resume-markdown-export.service'
import { resolvePdfFontPath } from '../../resume-pdf-fonts'

type PdfDocument = InstanceType<typeof PDFDocument>

type PdfTheme = {
  accent: string
  accentSoft: string
  border: string
  text: string
  muted: string
}

const SUB_CONTENT_INDENT = 24
const SECTION_BOTTOM_GAP = 7
const ITEM_BOTTOM_GAP = 8

const PDF_THEME: PdfTheme = {
  accent: '#1d4ed8',
  accentSoft: '#dbeafe',
  border: '#dbe1ea',
  text: '#111827',
  muted: '#667085',
}

function normalizeInlineMarkdown(value: string): string {
  return value
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\[(.+?)\]\((.+?)\)/g, '$1 ($2)')
}

function isMarkdownTableDivider(value: string) {
  return /^\|\s*(---\s*\|)+\s*$/.test(value)
}

function normalizeTableRow(value: string) {
  return value
    .split('|')
    .map((cell) => cell.trim())
    .filter(Boolean)
    .map((cell) => normalizeInlineMarkdown(cell))
    .join('  ·  ')
}

function resetCursor(document: PdfDocument) {
  document.x = document.page.margins.left
}

function reorderTitleBlock(lines: string[]) {
  if (lines[0]?.trim().startsWith('## ') && lines[1]?.trim().startsWith('# ')) {
    return [lines[1], '', lines[0], ...lines.slice(2)]
  }

  return lines
}

function ensureSpace(document: PdfDocument, height: number) {
  const bottom = document.page.height - document.page.margins.bottom

  if (document.y + height > bottom) {
    document.addPage()
    resetCursor(document)
  }
}

function setFont(
  document: PdfDocument,
  locale: ResumeLocale,
  cjkFontPath: string | null,
  weight: 'regular' | 'bold' = 'regular',
) {
  if (cjkFontPath) {
    document.font(cjkFontPath)
    return
  }

  if (locale === 'en' && weight === 'bold') {
    document.font('Helvetica-Bold')
    return
  }

  document.font('Helvetica')
}

function drawSectionDivider(document: PdfDocument, theme: PdfTheme) {
  const left = document.page.margins.left
  const right = document.page.width - document.page.margins.right
  const y = document.y + 2

  document
    .save()
    .strokeColor(theme.border)
    .lineWidth(1)
    .moveTo(left, y)
    .lineTo(right, y)
    .stroke()
    .restore()
}

function renderTitle(
  document: PdfDocument,
  value: string,
  locale: ResumeLocale,
  cjkFontPath: string | null,
  theme: PdfTheme,
) {
  ensureSpace(document, 40)
  setFont(document, locale, cjkFontPath)
  document.fillColor(theme.text).fontSize(22).text(normalizeInlineMarkdown(value), {
    align: 'center',
  })
  resetCursor(document)
  document.moveDown(0.45)
}

function renderSectionTitle(
  document: PdfDocument,
  value: string,
  locale: ResumeLocale,
  cjkFontPath: string | null,
  theme: PdfTheme,
) {
  ensureSpace(document, 32)
  setFont(document, locale, cjkFontPath)
  document.fillColor(theme.accent).fontSize(14).text(normalizeInlineMarkdown(value))
  drawSectionDivider(document, theme)
  resetCursor(document)
  document.moveDown(SECTION_BOTTOM_GAP / 12)
}

function renderSubheading(
  document: PdfDocument,
  value: string,
  locale: ResumeLocale,
  cjkFontPath: string | null,
  theme: PdfTheme,
  indentLevel = 1,
) {
  ensureSpace(document, 24)
  const resolvedIndentLevel = Math.max(1, indentLevel)
  const textX = document.page.margins.left + SUB_CONTENT_INDENT * resolvedIndentLevel
  const textWidth =
    document.page.width -
    document.page.margins.left -
    document.page.margins.right -
    SUB_CONTENT_INDENT * resolvedIndentLevel

  setFont(document, locale, cjkFontPath, 'bold')
  document
    .fillColor(theme.text)
    .fontSize(11.5)
    .text(normalizeInlineMarkdown(value), textX, document.y, {
      width: textWidth,
    })
  resetCursor(document)
  document.moveDown(0.12)
}

function renderTable(
  document: PdfDocument,
  rows: string[],
  locale: ResumeLocale,
  cjkFontPath: string | null,
  theme: PdfTheme,
) {
  const [headerRow, , valueRow] = rows
  const headers = headerRow
    .split('|')
    .map((cell) => cell.trim())
    .filter(Boolean)
  const values = (valueRow ?? '')
    .split('|')
    .map((cell) => cell.trim())
    .filter(Boolean)

  if (headers.length === 0 || values.length === 0) {
    return
  }

  const contentWidth = document.page.width - document.page.margins.left - document.page.margins.right
  const columnWidth = contentWidth / headers.length
  const headerHeight = 20
  const valueHeight = 34
  const totalHeight = headerHeight + valueHeight

  ensureSpace(document, totalHeight + 8)

  const left = document.page.margins.left
  const top = document.y

  document.save()
  document.roundedRect(left, top, contentWidth, totalHeight, 8).lineWidth(1).strokeColor(theme.border).stroke()
  document.rect(left, top, contentWidth, headerHeight).fillAndStroke(theme.accentSoft, theme.border)
  document.restore()

  headers.forEach((header, index) => {
    const cellLeft = left + columnWidth * index

    if (index > 0) {
      document
        .save()
        .strokeColor(theme.border)
        .moveTo(cellLeft, top)
        .lineTo(cellLeft, top + totalHeight)
        .stroke()
        .restore()
    }

    setFont(document, locale, cjkFontPath, 'bold')
    document
      .fillColor(theme.accent)
      .fontSize(9.2)
      .text(normalizeInlineMarkdown(header), cellLeft + 8, top + 6, {
        align: 'center',
        width: columnWidth - 16,
      })

    setFont(document, locale, cjkFontPath)
    document
      .fillColor(theme.text)
      .fontSize(9.2)
      .text(normalizeInlineMarkdown(values[index] ?? '-'), cellLeft + 8, top + headerHeight + 7, {
        align: 'center',
        width: columnWidth - 16,
        lineGap: 1,
      })
  })

  document.y = top + totalHeight + 10
  resetCursor(document)
}

function renderMetaLine(
  document: PdfDocument,
  value: string,
  locale: ResumeLocale,
  cjkFontPath: string | null,
  theme: PdfTheme,
  indentLevel = 1,
) {
  ensureSpace(document, 18)
  const resolvedIndentLevel = Math.max(1, indentLevel)
  const textX = document.page.margins.left + SUB_CONTENT_INDENT * resolvedIndentLevel
  const textWidth =
    document.page.width -
    document.page.margins.left -
    document.page.margins.right -
    SUB_CONTENT_INDENT * resolvedIndentLevel

  setFont(document, locale, cjkFontPath)
  document
    .fillColor(theme.muted)
    .fontSize(10)
    .text(normalizeInlineMarkdown(value), textX, document.y, {
      lineGap: 1.5,
      width: textWidth,
    })
  resetCursor(document)
  document.moveDown(0.05)
}

function renderParagraph(
  document: PdfDocument,
  value: string,
  locale: ResumeLocale,
  cjkFontPath: string | null,
  theme: PdfTheme,
  indentLevel = 1,
) {
  ensureSpace(document, 20)
  const resolvedIndentLevel = Math.max(1, indentLevel)
  const textX = document.page.margins.left + SUB_CONTENT_INDENT * resolvedIndentLevel
  const textWidth =
    document.page.width -
    document.page.margins.left -
    document.page.margins.right -
    SUB_CONTENT_INDENT * resolvedIndentLevel

  setFont(document, locale, cjkFontPath)
  document
    .fillColor(theme.text)
    .fontSize(10.5)
    .text(normalizeInlineMarkdown(value), textX, document.y, {
      lineGap: 2,
      width: textWidth,
    })
  resetCursor(document)
  document.moveDown(0.08)
}

function renderLabelLine(
  document: PdfDocument,
  label: string,
  value: string,
  locale: ResumeLocale,
  cjkFontPath: string | null,
  theme: PdfTheme,
  indentLevel = 1,
) {
  ensureSpace(document, 18)
  const resolvedIndentLevel = Math.max(1, indentLevel)
  const textX = document.page.margins.left + SUB_CONTENT_INDENT * resolvedIndentLevel
  const contentWidth =
    document.page.width -
    document.page.margins.left -
    document.page.margins.right -
    SUB_CONTENT_INDENT * resolvedIndentLevel

  setFont(document, locale, cjkFontPath, 'bold')
  document.fillColor(theme.accent).fontSize(10.2).text(label, textX, document.y, {
    continued: true,
    width: contentWidth,
  })
  setFont(document, locale, cjkFontPath)
  document.fillColor(theme.text).fontSize(10.2).text(` ${normalizeInlineMarkdown(value)}`, {
    width: contentWidth,
    lineGap: 1.5,
  })
  resetCursor(document)
}

function renderBullet(
  document: PdfDocument,
  value: string,
  locale: ResumeLocale,
  cjkFontPath: string | null,
  theme: PdfTheme,
  indentLevel = 1,
) {
  ensureSpace(document, 18)
  const left = document.page.margins.left
  const resolvedIndentLevel = Math.max(1, indentLevel)
  const bulletLeft = left + SUB_CONTENT_INDENT * resolvedIndentLevel
  const bulletY = document.y + 6
  const textX = bulletLeft + 12
  const textWidth =
    document.page.width -
    document.page.margins.left -
    document.page.margins.right -
    SUB_CONTENT_INDENT * resolvedIndentLevel -
    12

  document
    .save()
    .fillColor(theme.accent)
    .circle(bulletLeft + 3, bulletY, 1.8)
    .fill()
    .restore()
  setFont(document, locale, cjkFontPath)
  document.fillColor(theme.text).fontSize(10.3).text(normalizeInlineMarkdown(value), textX, document.y, {
    width: textWidth,
    lineGap: 1.6,
  })
  resetCursor(document)
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
    const lines = reorderTitleBlock(markdown.split('\n'))

    return new Promise((resolve, reject) => {
      const document = new PDFDocument({
        margin: 42,
        size: 'A4',
        info: {
          Title: `${resume.meta.slug}-${locale}`,
          Author: normalizeInlineMarkdown(resume.profile.fullName[locale]),
          Subject: 'Resume Export',
        },
      })
      const chunks: Buffer[] = []

      document.on('data', (chunk: Buffer | Uint8Array | string) => {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array))
      })
      document.on('end', () => resolve(Buffer.concat(chunks)))
      document.on('error', reject)

      for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index]
        const leadingWhitespace = line.match(/^\s*/)?.[0].length ?? 0
        const indentLevel = Math.floor(leadingWhitespace / 2)
        const contentLine = line.trimStart()
        const trimmedLine = contentLine.trim()

        if (!trimmedLine) {
          document.moveDown(0.18)
          continue
        }

        if (trimmedLine === '---') {
          continue
        }

        if (trimmedLine.startsWith('|')) {
          const tableLines = [trimmedLine]

          while (lines[index + tableLines.length]?.trim().startsWith('|')) {
            tableLines.push(lines[index + tableLines.length].trim())
          }

          if (tableLines.length >= 2 && !isMarkdownTableDivider(trimmedLine)) {
            renderTable(document, tableLines, locale, cjkFontPath, PDF_THEME)
          } else if (!isMarkdownTableDivider(trimmedLine)) {
            renderParagraph(
              document,
              normalizeTableRow(trimmedLine),
              locale,
              cjkFontPath,
              PDF_THEME,
              indentLevel,
            )
          }

          index += tableLines.length - 1
          continue
        }

        if (trimmedLine.startsWith('# ')) {
          renderTitle(document, trimmedLine.slice(2), locale, cjkFontPath, PDF_THEME)
          continue
        }

        if (trimmedLine.startsWith('## ')) {
          renderSectionTitle(document, trimmedLine.slice(3), locale, cjkFontPath, PDF_THEME)
          continue
        }

        if (trimmedLine.startsWith('### ')) {
          renderSubheading(
            document,
            trimmedLine.slice(4),
            locale,
            cjkFontPath,
            PDF_THEME,
            indentLevel,
          )
          continue
        }

        if (trimmedLine.startsWith('- ')) {
          renderBullet(
            document,
            trimmedLine.slice(2),
            locale,
            cjkFontPath,
            PDF_THEME,
            indentLevel,
          )
          continue
        }

        const labelMatch = trimmedLine.match(/^\*\*(.+?)\*\*\s+(.+)$/)

        if (labelMatch) {
          renderLabelLine(
            document,
            normalizeInlineMarkdown(labelMatch[1]),
            labelMatch[2],
            locale,
            cjkFontPath,
            PDF_THEME,
            indentLevel,
          )
          continue
        }

        if (trimmedLine.includes(' | ')) {
          renderMetaLine(
            document,
            trimmedLine,
            locale,
            cjkFontPath,
            PDF_THEME,
            indentLevel,
          )
          continue
        }

        renderParagraph(
          document,
          trimmedLine,
          locale,
          cjkFontPath,
          PDF_THEME,
          indentLevel,
        )
      }

      document.end()
    })
  }
}
