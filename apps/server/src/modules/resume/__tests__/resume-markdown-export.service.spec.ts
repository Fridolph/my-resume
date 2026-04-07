import { describe, expect, it } from 'vitest';

import { createExampleStandardResume } from '../domain/standard-resume';
import { ResumeMarkdownExportService } from '../resume-markdown-export.service';

describe('ResumeMarkdownExportService', () => {
  const service = new ResumeMarkdownExportService();

  it('should render a published resume as chinese markdown by default', () => {
    const resume = createExampleStandardResume();

    const markdown = service.render(resume, 'zh');

    expect(markdown).toContain('# 付寅生');
    expect(markdown).toContain('## 个人简介');
    expect(markdown).toContain('JS 全栈 / AI Agent 开发工程师');
    expect(markdown).toContain('### 成都澳昇能源科技有限责任公司');
    expect(markdown).toContain('### GreenSketch');
    expect(markdown).toContain('**项目核心功能:** 覆盖项目设计、报价生成、收益测算');
    expect(markdown).toContain('**亮点、难点与解决方案:**');
    expect(markdown).toContain('**技术栈:** Nuxt 4 / Vue 3 / TypeScript');
  });

  it('should render english markdown when locale is en', () => {
    const resume = createExampleStandardResume();

    const markdown = service.render(resume, 'en');

    expect(markdown).toContain('# Yinsheng Fu');
    expect(markdown).toContain('## Summary');
    expect(markdown).toContain('JavaScript Full-Stack / AI Agent Engineer');
    expect(markdown).toContain('### Chengdu Aosheng Energy Technology Co., Ltd.');
    expect(markdown).toContain('### GreenSketch');
    expect(markdown).toContain('**Core Functions:** Covers project design, quotation generation, revenue forecasting');
    expect(markdown).toContain('**Highlights, Challenges & Solutions:**');
    expect(markdown).toContain('AI Agent workflows');
  });
});
