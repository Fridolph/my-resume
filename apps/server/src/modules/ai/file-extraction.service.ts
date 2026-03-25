import { BadRequestException, Injectable } from '@nestjs/common';
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';

export interface ExtractableFileInput {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

export interface FileExtractionResult {
  fileName: string;
  fileType: 'txt' | 'md' | 'pdf' | 'docx';
  mimeType: string;
  text: string;
  charCount: number;
}

const SUPPORTED_EXTENSIONS = new Set(['txt', 'md', 'pdf', 'docx']);

function normalizeExtractedText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function readFileExtension(fileName: string): string {
  const extension = fileName.split('.').pop()?.trim().toLowerCase();

  return extension ?? '';
}

@Injectable()
export class FileExtractionService {
  async extractText(file: ExtractableFileInput): Promise<FileExtractionResult> {
    const extension = readFileExtension(file.originalname);

    if (!SUPPORTED_EXTENSIONS.has(extension)) {
      throw new BadRequestException(`Unsupported file type: ${extension}`);
    }

    const text = await this.extractByExtension(extension, file.buffer);
    const normalizedText = normalizeExtractedText(text);

    if (!normalizedText) {
      throw new BadRequestException('Extracted text is empty');
    }

    return {
      fileName: file.originalname,
      fileType: extension as FileExtractionResult['fileType'],
      mimeType: file.mimetype,
      text: normalizedText,
      charCount: normalizedText.length,
    };
  }

  private async extractByExtension(
    extension: string,
    buffer: Buffer,
  ): Promise<string> {
    if (extension === 'txt' || extension === 'md') {
      return buffer.toString('utf8');
    }

    if (extension === 'pdf') {
      const parser = new PDFParse({ data: buffer });
      try {
        const result = await parser.getText();
        return result.text;
      } finally {
        await parser.destroy();
      }
    }

    if (extension === 'docx') {
      const result = await mammoth.extractRawText({
        buffer,
      });
      return result.value;
    }

    throw new BadRequestException(`Unsupported file type: ${extension}`);
  }
}
