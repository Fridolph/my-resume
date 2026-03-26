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
  });

  it('should expose seeded demo reports for viewer read-only experience', () => {
    const reports = service.listReports();

    expect(reports.length).toBeGreaterThanOrEqual(3);
    expect(reports[0]).toHaveProperty('reportId');
  });
});
