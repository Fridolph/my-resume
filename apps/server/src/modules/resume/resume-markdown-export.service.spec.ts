import { describe, expect, it } from 'vitest';

import { createExampleStandardResume } from './domain/standard-resume';
import { ResumeMarkdownExportService } from './resume-markdown-export.service';

describe('ResumeMarkdownExportService', () => {
  const service = new ResumeMarkdownExportService();

  it('should render a published resume as chinese markdown by default', () => {
    const resume = createExampleStandardResume();

    const markdown = service.render(resume, 'zh');

    expect(markdown).toContain('# 付寅生');
    expect(markdown).toContain('## 个人简介');
    expect(markdown).toContain('前端工程师 / 前端负责人');
    expect(markdown).toContain('### 成都一蟹科技有限公司');
    expect(markdown).toContain('### 云药客 SaaS 系统');
    expect(markdown).toContain('Vite / Webpack / pnpm / Monorepo');
  });

  it('should render english markdown when locale is en', () => {
    const resume = createExampleStandardResume();

    const markdown = service.render(resume, 'en');

    expect(markdown).toContain('# Yinsheng Fu');
    expect(markdown).toContain('## Summary');
    expect(markdown).toContain('Frontend Engineer / Frontend Lead');
    expect(markdown).toContain('### Chengdu Yixie Technology Co., Ltd.');
    expect(markdown).toContain('### YYK SaaS Platform');
    expect(markdown).toContain('frontend engineering');
  });
});
