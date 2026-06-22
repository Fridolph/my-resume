import { describe, expect, it, vi } from 'vitest'
import PDFDocument from 'pdfkit'

vi.mock('pdf-parse', () => ({
  PDFParse: vi.fn().mockImplementation(() => ({
    getText: vi.fn().mockResolvedValue({
      text: 'PDF resume content',
    }),
    destroy: vi.fn().mockResolvedValue(undefined),
  })),
}))

import { FileExtractionService } from '../file-extraction.service'

function createPdfBuffer(text: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const document = new PDFDocument()
    const chunks: Buffer[] = []

    document.on('data', (chunk: Buffer | Uint8Array | string) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array))
    })
    document.on('end', () => {
      resolve(Buffer.concat(chunks))
    })
    document.on('error', reject)

    document.text(text)
    document.end()
  })
}

async function createDocxBuffer(text: string): Promise<Buffer> {
  const documentXml = [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">',
    '<w:body><w:p><w:r><w:t>',
    text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;'),
    '</w:t></w:r></w:p></w:body></w:document>',
  ].join('')

  return createZipBuffer([
    {
      name: '[Content_Types].xml',
      content: [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">',
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>',
        '<Default Extension="xml" ContentType="application/xml"/>',
        '<Override PartName="/word/document.xml" ',
        'ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>',
        '</Types>',
      ].join(''),
    },
    {
      name: '_rels/.rels',
      content: [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
        '<Relationship Id="rId1" ',
        'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" ',
        'Target="word/document.xml"/>',
        '</Relationships>',
      ].join(''),
    },
    {
      name: 'word/document.xml',
      content: documentXml,
    },
  ])
}

function createZipBuffer(files: Array<{ name: string; content: string }>) {
  const localParts: Buffer[] = []
  const centralParts: Buffer[] = []
  let offset = 0

  for (const file of files) {
    const name = Buffer.from(file.name)
    const content = Buffer.from(file.content)
    const checksum = crc32(content)
    const localHeader = Buffer.alloc(30)

    localHeader.writeUInt32LE(0x04034b50, 0)
    localHeader.writeUInt16LE(20, 4)
    localHeader.writeUInt16LE(0, 6)
    localHeader.writeUInt16LE(0, 8)
    localHeader.writeUInt16LE(0, 10)
    localHeader.writeUInt16LE(0, 12)
    localHeader.writeUInt32LE(checksum, 14)
    localHeader.writeUInt32LE(content.length, 18)
    localHeader.writeUInt32LE(content.length, 22)
    localHeader.writeUInt16LE(name.length, 26)
    localHeader.writeUInt16LE(0, 28)

    localParts.push(localHeader, name, content)

    const centralHeader = Buffer.alloc(46)
    centralHeader.writeUInt32LE(0x02014b50, 0)
    centralHeader.writeUInt16LE(20, 4)
    centralHeader.writeUInt16LE(20, 6)
    centralHeader.writeUInt16LE(0, 8)
    centralHeader.writeUInt16LE(0, 10)
    centralHeader.writeUInt16LE(0, 12)
    centralHeader.writeUInt16LE(0, 14)
    centralHeader.writeUInt32LE(checksum, 16)
    centralHeader.writeUInt32LE(content.length, 20)
    centralHeader.writeUInt32LE(content.length, 24)
    centralHeader.writeUInt16LE(name.length, 28)
    centralHeader.writeUInt16LE(0, 30)
    centralHeader.writeUInt16LE(0, 32)
    centralHeader.writeUInt16LE(0, 34)
    centralHeader.writeUInt16LE(0, 36)
    centralHeader.writeUInt32LE(0, 38)
    centralHeader.writeUInt32LE(offset, 42)
    centralParts.push(centralHeader, name)

    offset += localHeader.length + name.length + content.length
  }

  const centralDirectory = Buffer.concat(centralParts)
  const endRecord = Buffer.alloc(22)

  endRecord.writeUInt32LE(0x06054b50, 0)
  endRecord.writeUInt16LE(0, 4)
  endRecord.writeUInt16LE(0, 6)
  endRecord.writeUInt16LE(files.length, 8)
  endRecord.writeUInt16LE(files.length, 10)
  endRecord.writeUInt32LE(centralDirectory.length, 12)
  endRecord.writeUInt32LE(offset, 16)
  endRecord.writeUInt16LE(0, 20)

  return Buffer.concat([...localParts, centralDirectory, endRecord])
}

function crc32(buffer: Buffer) {
  let crc = 0xffffffff

  for (const byte of buffer) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
    }
  }

  return (crc ^ 0xffffffff) >>> 0
}

describe('FileExtractionService', () => {
  const service = new FileExtractionService()

  it('should extract plain text from txt files', async () => {
    const result = await service.extractText({
      buffer: Buffer.from('hello txt world', 'utf8'),
      originalname: 'resume.txt',
      mimetype: 'text/plain',
      size: 15,
    })

    expect(result.fileType).toBe('txt')
    expect(result.text).toContain('hello txt world')
  })

  it('should extract markdown source as plain text content', async () => {
    const result = await service.extractText({
      buffer: Buffer.from('# Resume\n\n- TypeScript\n- NestJS', 'utf8'),
      originalname: 'resume.md',
      mimetype: 'text/markdown',
      size: 32,
    })

    expect(result.fileType).toBe('md')
    expect(result.text).toContain('# Resume')
    expect(result.text).toContain('NestJS')
  })

  it('should extract text from pdf files', async () => {
    const buffer = await createPdfBuffer('PDF resume content')

    const result = await service.extractText({
      buffer,
      originalname: 'resume.pdf',
      mimetype: 'application/pdf',
      size: buffer.byteLength,
    })

    expect(result.fileType).toBe('pdf')
    expect(result.text).toContain('PDF resume content')
  })

  it('should extract text from docx files', async () => {
    const buffer = await createDocxBuffer('DOCX resume content')

    const result = await service.extractText({
      buffer,
      originalname: 'resume.docx',
      mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      size: buffer.byteLength,
    })

    expect(result.fileType).toBe('docx')
    expect(result.text).toContain('DOCX resume content')
  })

  it('should reject unsupported file types', async () => {
    await expect(
      service.extractText({
        buffer: Buffer.from('noop', 'utf8'),
        originalname: 'resume.csv',
        mimetype: 'text/csv',
        size: 4,
      }),
    ).rejects.toThrow('Unsupported file type: csv')
  })
})
