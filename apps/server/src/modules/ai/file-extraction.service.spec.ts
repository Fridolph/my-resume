import { describe, expect, it, jest } from '@jest/globals';
import { Document, Packer, Paragraph } from 'docx';
import PDFDocument from 'pdfkit';

jest.mock('pdf-parse', () => ({
  PDFParse: jest.fn().mockImplementation(() => ({
    getText: jest.fn().mockResolvedValue({
      text: 'PDF resume content',
    }),
    destroy: jest.fn().mockResolvedValue(undefined),
  })),
}));

import { FileExtractionService } from './file-extraction.service';

function createPdfBuffer(text: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const document = new PDFDocument();
    const chunks: Buffer[] = [];

    document.on('data', (chunk: Buffer | Uint8Array | string) => {
      chunks.push(
        Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array),
      );
    });
    document.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    document.on('error', reject);

    document.text(text);
    document.end();
  });
}

async function createDocxBuffer(text: string): Promise<Buffer> {
  const document = new Document({
    sections: [
      {
        children: [new Paragraph(text)],
      },
    ],
  });

  return Buffer.from(await Packer.toBuffer(document));
}

describe('FileExtractionService', () => {
  const service = new FileExtractionService();

  it('should extract plain text from txt files', async () => {
    const result = await service.extractText({
      buffer: Buffer.from('hello txt world', 'utf8'),
      originalname: 'resume.txt',
      mimetype: 'text/plain',
      size: 15,
    });

    expect(result.fileType).toBe('txt');
    expect(result.text).toContain('hello txt world');
  });

  it('should extract markdown source as plain text content', async () => {
    const result = await service.extractText({
      buffer: Buffer.from('# Resume\n\n- TypeScript\n- NestJS', 'utf8'),
      originalname: 'resume.md',
      mimetype: 'text/markdown',
      size: 32,
    });

    expect(result.fileType).toBe('md');
    expect(result.text).toContain('# Resume');
    expect(result.text).toContain('NestJS');
  });

  it('should extract text from pdf files', async () => {
    const buffer = await createPdfBuffer('PDF resume content');

    const result = await service.extractText({
      buffer,
      originalname: 'resume.pdf',
      mimetype: 'application/pdf',
      size: buffer.byteLength,
    });

    expect(result.fileType).toBe('pdf');
    expect(result.text).toContain('PDF resume content');
  });

  it('should extract text from docx files', async () => {
    const buffer = await createDocxBuffer('DOCX resume content');

    const result = await service.extractText({
      buffer,
      originalname: 'resume.docx',
      mimetype:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      size: buffer.byteLength,
    });

    expect(result.fileType).toBe('docx');
    expect(result.text).toContain('DOCX resume content');
  });

  it('should reject unsupported file types', async () => {
    await expect(
      service.extractText({
        buffer: Buffer.from('noop', 'utf8'),
        originalname: 'resume.csv',
        mimetype: 'text/csv',
        size: 4,
      }),
    ).rejects.toThrow('Unsupported file type: csv');
  });
});
