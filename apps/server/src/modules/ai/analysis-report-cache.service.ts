import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';

export type AnalysisScenario = 'jd-match' | 'resume-review' | 'offer-compare';
export type AnalysisLocale = 'zh' | 'en';

export interface AnalysisReportSection {
  key: string;
  title: string;
  bullets: string[];
}

export interface AnalysisReport {
  reportId: string;
  cacheKey: string;
  scenario: AnalysisScenario;
  locale: AnalysisLocale;
  sourceHash: string;
  inputPreview: string;
  summary: string;
  sections: AnalysisReportSection[];
  generator: 'mock-cache' | 'ai-provider';
  createdAt: string;
}

export interface GetOrCreateReportInput {
  scenario: AnalysisScenario;
  content: string;
  locale?: AnalysisLocale;
}

export interface CachedAnalysisReportResult {
  cached: boolean;
  report: AnalysisReport;
}

interface StoreGeneratedReportInput extends GetOrCreateReportInput {
  generatedText: string;
  providerSummary: {
    provider: string;
    model: string;
    mode: string;
  };
}

const SUPPORTED_SCENARIOS = new Set<AnalysisScenario>([
  'jd-match',
  'resume-review',
  'offer-compare',
]);

function normalizeContent(content: string): string {
  return content.replace(/\s+/g, ' ').trim();
}

function computeHash(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

function buildInputPreview(content: string): string {
  return content.slice(0, 120);
}

function extractKeywords(content: string, locale: AnalysisLocale): string[] {
  const matches = content.match(/[A-Za-z0-9.+#-]{2,}/g) ?? [];
  const unique = Array.from(new Set(matches.map((item) => item.toLowerCase())));

  if (unique.length > 0) {
    return unique.slice(0, 3);
  }

  return locale === 'en'
    ? ['resume', 'experience', 'skills']
    : ['简历', '经历', '技能'];
}

function buildSummary(
  scenario: AnalysisScenario,
  keywords: string[],
  locale: AnalysisLocale,
): string {
  if (locale === 'en') {
    if (scenario === 'jd-match') {
      return `Cached JD match preview highlights ${keywords.join(', ')} and keeps the result reusable for the same input.`;
    }

    if (scenario === 'resume-review') {
      return `Cached resume review focuses on ${keywords.join(', ')} and keeps a stable mock report for tutorials.`;
    }

    return `Cached offer comparison starts from ${keywords.join(', ')} and provides a deterministic demo result.`;
  }

  if (scenario === 'jd-match') {
    return `当前为缓存版 JD 匹配预览，重点围绕 ${keywords.join('、')} 生成稳定报告，便于教程阶段复用。`;
  }

  if (scenario === 'resume-review') {
    return `当前为缓存版简历建议预览，聚焦 ${keywords.join('、')}，用于演示稳定的 mock 分析结果。`;
  }

  return `当前为缓存版 offer 对比预览，从 ${keywords.join('、')} 等维度给出可复用的演示结论。`;
}

function buildSections(
  scenario: AnalysisScenario,
  keywords: string[],
  locale: AnalysisLocale,
): AnalysisReportSection[] {
  if (locale === 'en') {
    if (scenario === 'jd-match') {
      return [
        {
          key: 'match-overview',
          title: 'Match Overview',
          bullets: [
            `The current input already mentions ${keywords[0]} and ${keywords[1] ?? keywords[0]}.`,
            'This report is cached by normalized input and can be reused directly.',
          ],
        },
        {
          key: 'missing-signals',
          title: 'Missing Signals',
          bullets: [
            'Add more quantified outcomes to improve credibility.',
            'Clarify collaboration scope, ownership, and delivery impact.',
          ],
        },
        {
          key: 'next-actions',
          title: 'Next Actions',
          bullets: [
            'Keep this cached preview for viewer demo mode.',
            'Upgrade to real provider analysis in the next milestone step.',
          ],
        },
      ];
    }

    if (scenario === 'resume-review') {
      return [
        {
          key: 'strengths',
          title: 'Strengths',
          bullets: [
            `The resume already exposes keywords like ${keywords.join(', ')}.`,
            'Content blocks are ready for a later bilingual polishing flow.',
          ],
        },
        {
          key: 'risks',
          title: 'Risks',
          bullets: [
            'Project outcomes may still feel too generic.',
            'Technical depth can be supported by clearer architecture context.',
          ],
        },
        {
          key: 'recommendations',
          title: 'Recommendations',
          bullets: [
            'Prepare one stronger summary sentence for each project.',
            'Reserve this structure for later real AI review output.',
          ],
        },
      ];
    }

    return [
      {
        key: 'comparison',
        title: 'Comparison Axes',
        bullets: [
          `Use ${keywords.join(', ')} as demo dimensions for the mock report.`,
          'Keep the current output deterministic for repeatable tutorials.',
        ],
      },
      {
        key: 'suggestion',
        title: 'Suggestion',
        bullets: [
          'Prefer the option with clearer growth path and ownership scope.',
          'Treat the current result as a cached walkthrough, not final advice.',
        ],
      },
      {
        key: 'follow-up',
        title: 'Follow-up',
        bullets: [
          'Add real provider orchestration in the next AI milestone step.',
          'Add viewer read-only access after role boundary refinement.',
        ],
      },
    ];
  }

  if (scenario === 'jd-match') {
    return [
      {
        key: 'match-overview',
        title: '匹配概览',
        bullets: [
          `当前输入已经覆盖 ${keywords[0]}、${keywords[1] ?? keywords[0]} 等关键信号。`,
          '结果按归一化输入缓存，可直接复用同一份预设报告。',
        ],
      },
      {
        key: 'missing-signals',
        title: '待补信号',
        bullets: [
          '可继续补充量化结果与业务影响，增强可信度。',
          '可补充协作范围、负责模块和落地结果。',
        ],
      },
      {
        key: 'next-actions',
        title: '下一步建议',
        bullets: [
          '当前结果适合用于 viewer 体验态演示。',
          '后续再接入真实 Provider 与任务编排。',
        ],
      },
    ];
  }

  if (scenario === 'resume-review') {
    return [
      {
        key: 'strengths',
        title: '已有亮点',
        bullets: [
          `简历中已经体现 ${keywords.join('、')} 等关键词。`,
          '内容结构适合后续继续补充双语润色与发布流。',
        ],
      },
      {
        key: 'risks',
        title: '风险提示',
        bullets: [
          '项目成果描述还可以更具体，避免过于概括。',
          '技术栈描述可增加架构背景与取舍说明。',
        ],
      },
      {
        key: 'recommendations',
        title: '优化建议',
        bullets: [
          '为每个项目补一条最强结果描述。',
          '当前结构先稳定下来，后续再替换成真实 AI 输出。',
        ],
      },
    ];
  }

  return [
    {
      key: 'comparison',
      title: '对比维度',
      bullets: [
        `当前用 ${keywords.join('、')} 作为演示维度生成稳定 mock 结果。`,
        '适合教程阶段重复演示缓存命中效果。',
      ],
    },
    {
      key: 'suggestion',
      title: '建议结论',
      bullets: [
        '优先选择成长空间更清晰、职责边界更明确的一方。',
        '当前输出仅作为缓存示例，不作为真实决策建议。',
      ],
    },
    {
      key: 'follow-up',
      title: '后续补充',
      bullets: [
        '下一步接入真实 Provider 与管理员触发能力。',
        '随后再补 viewer 只读缓存体验闭环。',
      ],
    },
  ];
}

@Injectable()
export class AnalysisReportCacheService {
  private readonly cache = new Map<string, AnalysisReport>();
  private readonly reportIndex = new Map<string, AnalysisReport>();

  getOrCreateReport(input: GetOrCreateReportInput): CachedAnalysisReportResult {
    const scenario = this.validateScenario(input.scenario);
    const locale = this.validateLocale(input.locale ?? 'zh');
    const normalizedContent = normalizeContent(input.content);

    if (!normalizedContent) {
      throw new BadRequestException('Content is required');
    }

    const sourceHash = computeHash(normalizedContent);
    const cacheKey = `${scenario}:${locale}:${sourceHash}`;
    const cachedReport = this.cache.get(cacheKey);

    if (cachedReport) {
      return {
        cached: true,
        report: cachedReport,
      };
    }

    const keywords = extractKeywords(normalizedContent, locale);
    const report: AnalysisReport = {
      reportId: `${scenario}-${sourceHash.slice(0, 12)}`,
      cacheKey,
      scenario,
      locale,
      sourceHash,
      inputPreview: buildInputPreview(normalizedContent),
      summary: buildSummary(scenario, keywords, locale),
      sections: buildSections(scenario, keywords, locale),
      generator: 'mock-cache',
      createdAt: new Date().toISOString(),
    };

    this.cache.set(cacheKey, report);
    this.reportIndex.set(report.reportId, report);

    return {
      cached: false,
      report,
    };
  }

  storeGeneratedReport(input: StoreGeneratedReportInput): AnalysisReport {
    const scenario = this.validateScenario(input.scenario);
    const locale = this.validateLocale(input.locale ?? 'zh');
    const normalizedContent = normalizeContent(input.content);

    if (!normalizedContent) {
      throw new BadRequestException('Content is required');
    }

    const sourceHash = computeHash(normalizedContent);
    const cacheKey = `${scenario}:${locale}:${sourceHash}`;
    const report: AnalysisReport = {
      reportId: `${scenario}-${sourceHash.slice(0, 12)}`,
      cacheKey,
      scenario,
      locale,
      sourceHash,
      inputPreview: buildInputPreview(normalizedContent),
      summary: input.generatedText.trim(),
      sections: [
        {
          key: 'analysis-result',
          title: locale === 'en' ? 'Analysis Result' : '分析结果',
          bullets: [input.generatedText.trim()],
        },
        {
          key: 'provider',
          title: locale === 'en' ? 'Provider Info' : 'Provider 信息',
          bullets: [
            `${input.providerSummary.provider} / ${input.providerSummary.model}`,
            locale === 'en'
              ? `Runtime mode: ${input.providerSummary.mode}`
              : `运行模式：${input.providerSummary.mode}`,
          ],
        },
        {
          key: 'next-step',
          title: locale === 'en' ? 'Next Step' : '下一步',
          bullets: [
            locale === 'en'
              ? 'Viewer can now read this cached result without triggering a new request.'
              : '当前结果已进入缓存，viewer 可直接只读查看。',
            locale === 'en'
              ? 'This endpoint stays as the admin trigger boundary for later real AI integration.'
              : '该入口作为后续真实 AI 接入前的管理员触发边界。',
          ],
        },
      ],
      generator: 'ai-provider',
      createdAt: new Date().toISOString(),
    };

    this.cache.set(cacheKey, report);
    this.reportIndex.set(report.reportId, report);

    return report;
  }

  listReports() {
    this.ensureDemoReports();

    return Array.from(this.reportIndex.values())
      .sort((left, right) => left.reportId.localeCompare(right.reportId))
      .map((report) => ({
        reportId: report.reportId,
        scenario: report.scenario,
        locale: report.locale,
        summary: report.summary,
        generator: report.generator,
        createdAt: report.createdAt,
      }));
  }

  getReportById(reportId: string): AnalysisReport {
    this.ensureDemoReports();

    const report = this.reportIndex.get(reportId);

    if (!report) {
      throw new NotFoundException('Cached analysis report not found');
    }

    return report;
  }

  private validateScenario(scenario: string): AnalysisScenario {
    if (!SUPPORTED_SCENARIOS.has(scenario as AnalysisScenario)) {
      throw new BadRequestException(
        `Unsupported analysis scenario: ${scenario}`,
      );
    }

    return scenario as AnalysisScenario;
  }

  private validateLocale(locale: string): AnalysisLocale {
    if (locale !== 'zh' && locale !== 'en') {
      throw new BadRequestException(`Unsupported locale: ${locale}`);
    }

    return locale;
  }

  private ensureDemoReports() {
    if (this.reportIndex.size > 0) {
      return;
    }

    this.getOrCreateReport({
      scenario: 'jd-match',
      content: 'NestJS React TypeScript Redis BullMQ',
      locale: 'zh',
    });
    this.getOrCreateReport({
      scenario: 'resume-review',
      content: 'Resume review for bilingual full-stack engineer',
      locale: 'en',
    });
    this.getOrCreateReport({
      scenario: 'offer-compare',
      content: 'Growth ownership salary team culture',
      locale: 'zh',
    });
  }
}
