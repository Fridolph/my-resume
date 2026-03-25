import { describe, expect, it } from '@jest/globals';

import { createExampleStandardResume } from './domain/standard-resume';
import { ResumeMarkdownExportService } from './resume-markdown-export.service';

describe('ResumeMarkdownExportService', () => {
  const service = new ResumeMarkdownExportService();

  it('should render a published resume as chinese markdown by default', () => {
    const resume = createExampleStandardResume();

    const markdown = service.render(resume, 'zh');

    expect(markdown).toContain('# 付寅生');
    expect(markdown).toContain('## 个人简介');
    expect(markdown).toContain('全栈开发工程师');
    expect(markdown).toContain('### 示例科技');
    expect(markdown).toContain('Vue 3 / React / TypeScript / NestJS');
  });

  it('should render english markdown when locale is en', () => {
    const resume = createExampleStandardResume();

    const markdown = service.render(resume, 'en');

    expect(markdown).toContain('# Yinsheng Fu');
    expect(markdown).toContain('## Summary');
    expect(markdown).toContain('Full-Stack Engineer');
    expect(markdown).toContain('### Example Tech');
    expect(markdown).toContain('Focused on frontend engineering');
  });
});
