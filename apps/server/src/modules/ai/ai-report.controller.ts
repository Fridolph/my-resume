import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
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

@Controller('ai/reports')
@UseGuards(JwtAuthGuard)
export class AiReportController {
  constructor(
    private readonly analysisReportCacheService: AnalysisReportCacheService,
  ) {}

  @Post('cache')
  cacheReport(@Body() body: CacheReportBody) {
    return this.analysisReportCacheService.getOrCreateReport(body);
  }

  @Get('cache/:reportId')
  getCachedReport(@Param('reportId') reportId: string) {
    return this.analysisReportCacheService.getReportById(reportId);
  }
}
