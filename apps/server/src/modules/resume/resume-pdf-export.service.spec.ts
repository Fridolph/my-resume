import { describe, expect, it } from 'vitest';

import { createExampleStandardResume } from './domain/standard-resume';
import { ResumeMarkdownExportService } from './resume-markdown-export.service';
import { ResumePdfExportService } from './resume-pdf-export.service';

describe('ResumePdfExportService', () => {
  const markdownService = new ResumeMarkdownExportService();
  const service = new ResumePdfExportService(markdownService);

  it('should render the published resume into a pdf buffer', async () => {
    const resume = createExampleStandardResume();

    const pdfBuffer = await service.render(resume, 'zh');

    expect(pdfBuffer.byteLength).toBeGreaterThan(100);
    expect(pdfBuffer.subarray(0, 4).toString('utf8')).toBe('%PDF');
  });
});
