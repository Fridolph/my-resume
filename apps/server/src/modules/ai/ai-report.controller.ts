import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { RequireCapability } from '../auth/decorators/require-capability.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleCapabilitiesGuard } from '../auth/guards/role-capabilities.guard';
import { AiService } from './ai.service';
import {
  AnalysisLocale,
  AnalysisScenario,
  AnalysisReportCacheService,
} from './analysis-report-cache.service';

interface CacheReportBody {
  scenario: AnalysisScenario;
  content: string;
  locale?: AnalysisLocale;
}

const SUPPORTED_SCENARIOS: AnalysisScenario[] = [
  'jd-match',
  'resume-review',
  'offer-compare',
];

@Controller('ai/reports')
@UseGuards(JwtAuthGuard)
export class AiReportController {
  constructor(
    @Inject(AiService)
    private readonly aiService: AiService,
    @Inject(AnalysisReportCacheService)
    private readonly analysisReportCacheService: AnalysisReportCacheService,
  ) {}

  @Get('cache')
  listCachedReports() {
    return {
      reports: this.analysisReportCacheService.listReports(),
    };
  }

  @Get('runtime')
  getRuntimeSummary() {
    return {
      ...this.aiService.getProviderSummary(),
      supportedScenarios: SUPPORTED_SCENARIOS,
    };
  }

  @Post('cache')
  @UseGuards(RoleCapabilitiesGuard)
  @RequireCapability('canTriggerAiAnalysis')
  cacheReport(@Body() body: CacheReportBody) {
    return this.analysisReportCacheService.getOrCreateReport(body);
  }

  @Get('cache/:reportId')
  getCachedReport(@Param('reportId') reportId: string) {
    return this.analysisReportCacheService.getReportById(reportId);
  }

  @Post('analyze')
  @UseGuards(RoleCapabilitiesGuard)
  @RequireCapability('canTriggerAiAnalysis')
  async analyzeReport(@Body() body: CacheReportBody) {
    const result = await this.aiService.generateText({
      systemPrompt:
        body.locale === 'en'
          ? 'You are a concise resume analysis assistant.'
          : '你是一个简洁的简历分析助手。',
      prompt: this.buildAnalysisPrompt(body),
    });

    return {
      cached: false,
      report: this.analysisReportCacheService.storeGeneratedReport({
        ...body,
        generatedText: result.text,
        providerSummary: this.aiService.getProviderSummary(),
      }),
    };
  }

  private buildAnalysisPrompt(body: CacheReportBody): string {
    if (body.locale === 'en') {
      return `Scenario: ${body.scenario}\nPlease give a short analysis for the following content:\n${body.content}`;
    }

    return `分析场景：${body.scenario}\n请基于以下内容给出简短分析：\n${body.content}`;
  }
}
