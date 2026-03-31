import { describe, expect, it } from 'vitest';

import { AnalysisReportCacheService } from './analysis-report-cache.service';

describe('AnalysisReportCacheService', () => {
  const service = new AnalysisReportCacheService();

  it('should create a stable mock report and reuse cache for the same input', () => {
    const first = service.getOrCreateReport({
      scenario: 'jd-match',
      content: 'NestJS React TypeScript Redis',
      locale: 'zh',
    });

    const second = service.getOrCreateReport({
      scenario: 'jd-match',
      content: 'NestJS   React TypeScript Redis',
      locale: 'zh',
    });

    expect(first.cached).toBe(false);
    expect(second.cached).toBe(true);
    expect(second.report.reportId).toBe(first.report.reportId);
    expect(second.report.summary).toBe(first.report.summary);
    expect(first.report.score.value).toBeGreaterThan(0);
    expect(first.report.strengths.length).toBeGreaterThan(0);
    expect(first.report.gaps.length).toBeGreaterThan(0);
    expect(first.report.risks.length).toBeGreaterThan(0);
    expect(first.report.suggestions.length).toBeGreaterThan(0);
  });

  it('should create different cache keys for different scenarios', () => {
    const jdReport = service.getOrCreateReport({
      scenario: 'jd-match',
      content: 'React Next.js TypeScript',
      locale: 'zh',
    });
    const offerReport = service.getOrCreateReport({
      scenario: 'offer-compare',
      content: 'React Next.js TypeScript',
      locale: 'zh',
    });

    expect(jdReport.report.reportId).not.toBe(offerReport.report.reportId);
    expect(jdReport.report.scenario).toBe('jd-match');
    expect(offerReport.report.scenario).toBe('offer-compare');
  });

  it('should read a cached report by report id', () => {
    const created = service.getOrCreateReport({
      scenario: 'resume-review',
      content: 'Vue React NestJS Resume Review',
      locale: 'en',
    });

    const report = service.getReportById(created.report.reportId);

    expect(report.reportId).toBe(created.report.reportId);
    expect(report.locale).toBe('en');
    expect(report.score.label.length).toBeGreaterThan(0);
  });

  it('should expose seeded demo reports for viewer read-only experience', () => {
    const reports = service.listReports();

    expect(reports.length).toBeGreaterThanOrEqual(3);
    expect(reports[0]).toHaveProperty('reportId');
  });

  it('should normalize generated analysis into a stable structured contract', () => {
    const report = service.storeGeneratedReport({
      scenario: 'resume-review',
      content: 'React Next.js TypeScript dashboard experience',
      locale: 'zh',
      generatedText: JSON.stringify({
        summary: '当前简历已经具备 React 与 Next.js 相关基础，但成果表达还不够聚焦。',
        score: {
          value: 78,
          label: '具备竞争力',
          reason: '已有核心关键词，但缺少量化成果与主导范围说明。',
        },
        strengths: ['已覆盖 React、Next.js、TypeScript 等目标岗位关键词。'],
        gaps: ['缺少能够直接映射业务结果的量化描述。'],
        risks: ['如果只列技术栈，容易被理解为使用过但未形成主导能力。'],
        suggestions: [
          {
            key: 'profile-summary',
            title: '先优化个人摘要',
            module: 'profile',
            reason: '摘要是 HR 和面试官最快读取的入口，应先突出定位与结果。',
            actions: ['补一条面向岗位的定位句', '加入一条代表性结果描述'],
          },
        ],
      }),
      providerSummary: {
        provider: 'qiniu',
        model: 'deepseek-v3',
        mode: 'openai-compatible',
      },
    });

    expect(report.summary).toContain('当前简历已经具备 React 与 Next.js');
    expect(report.score).toEqual({
      value: 78,
      label: '具备竞争力',
      reason: '已有核心关键词，但缺少量化成果与主导范围说明。',
    });
    expect(report.strengths).toContain(
      '已覆盖 React、Next.js、TypeScript 等目标岗位关键词。',
    );
    expect(report.suggestions[0]).toMatchObject({
      key: 'profile-summary',
      module: 'profile',
      title: '先优化个人摘要',
    });
  });
});
