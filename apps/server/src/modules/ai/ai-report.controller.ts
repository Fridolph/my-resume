import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'

import { RequireCapability } from '../auth/decorators/require-capability.decorator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RoleCapabilitiesGuard } from '../auth/guards/role-capabilities.guard'
import { AiService } from './ai.service'
import {
  AiUsageRecordFilterType,
  AiUsageRecordService,
} from './ai-usage-record.service'
import {
  ApplyResumeOptimizationInput,
  AiResumeOptimizationService,
  GenerateResumeOptimizationInput,
} from './ai-resume-optimization.service'
import {
  AnalysisScenario,
  AnalysisReportCacheService,
} from './analysis-report-cache.service'
import type { AnalysisLocale } from './analysis-report-cache.service'

interface CacheReportBody {
  scenario: AnalysisScenario
  content: string
  locale?: AnalysisLocale
}

interface HistoryQuery {
  limit?: string
  type?: AiUsageRecordFilterType
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface ResumeOptimizationBody extends GenerateResumeOptimizationInput {}
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface ApplyResumeOptimizationBody extends ApplyResumeOptimizationInput {}

const SUPPORTED_SCENARIOS: AnalysisScenario[] = [
  'jd-match',
  'resume-review',
  'offer-compare',
]

@Controller('ai/reports')
@UseGuards(JwtAuthGuard)
export class AiReportController {
  constructor(
    @Inject(AiService)
    private readonly aiService: AiService,
    @Inject(AiUsageRecordService)
    private readonly aiUsageRecordService: AiUsageRecordService,
    @Inject(AiResumeOptimizationService)
    private readonly aiResumeOptimizationService: AiResumeOptimizationService,
    @Inject(AnalysisReportCacheService)
    private readonly analysisReportCacheService: AnalysisReportCacheService,
  ) {}

  @Get('cache')
  listCachedReports() {
    return {
      reports: this.analysisReportCacheService.listReports(),
    }
  }

  /**
   * 返回 AI provider 与可用分析场景摘要
   * @returns 运行时摘要
   */
  @Get('runtime')
  getRuntimeSummary() {
    // 先暴露 provider/model 摘要，便于教学演示和运行态排查。
    return {
      ...this.aiService.getProviderSummary(),
      supportedScenarios: SUPPORTED_SCENARIOS,
    }
  }

  @Get('history')
  async listUsageHistory(@Query() query: HistoryQuery) {
    return {
      records: await this.aiUsageRecordService.listHistory({
        type: query.type ?? 'all',
        limit: query.limit ? Number(query.limit) : undefined,
      }),
    }
  }

  @Get('history/:recordId')
  async getUsageHistoryDetail(@Param('recordId') recordId: string) {
    return this.aiUsageRecordService.getDetail(recordId)
  }

  @Post('cache')
  @UseGuards(RoleCapabilitiesGuard)
  @RequireCapability('canTriggerAiAnalysis')
  cacheReport(@Body() body: CacheReportBody) {
    return this.analysisReportCacheService.getOrCreateReport(body)
  }

  @Get('cache/:reportId')
  getCachedReport(@Param('reportId') reportId: string) {
    return this.analysisReportCacheService.getReportById(reportId)
  }

  /**
   * 执行结构化分析并写入报告缓存
   * @param body 分析请求体
   * @returns 结构化分析结果
   */
  @Post('analyze')
  @UseGuards(RoleCapabilitiesGuard)
  @RequireCapability('canTriggerAiAnalysis')
  async analyzeReport(@Body() body: CacheReportBody) {
    const locale = body.locale ?? 'zh'
    const startedAt = Date.now()
    const providerSummary = this.aiService.getProviderSummary()
    const generator = providerSummary.mode === 'mock' ? 'mock-cache' : 'ai-provider'

    try {
      const result = await this.aiService.generateText({
        systemPrompt: this.buildAnalysisSystemPrompt(locale),
        prompt: this.buildAnalysisPrompt(body),
      })
      const report = this.analysisReportCacheService.storeGeneratedReport({
        ...body,
        generatedText: result.text,
        providerSummary,
      })
      const usageRecord = await this.aiUsageRecordService.recordSuccess({
        operationType: 'analysis-report',
        scenario: body.scenario,
        locale,
        inputPreview: body.content,
        summary: report.summary,
        providerSummary,
        generator,
        relatedReportId: report.reportId,
        detail: report,
        durationMs: Date.now() - startedAt,
      })

      return {
        cached: false,
        report,
        usageRecordId: usageRecord.id,
      }
    } catch (error) {
      await this.aiUsageRecordService.recordFailure({
        operationType: 'analysis-report',
        scenario: body.scenario,
        locale,
        inputPreview: body.content,
        providerSummary,
        generator,
        errorMessage: error instanceof Error ? error.message : 'Analysis request failed',
        durationMs: Date.now() - startedAt,
      })

      throw error
    }
  }

  /**
   * 生成简历优化建议与 diff，不直接写库
   * @param body 优化请求体
   * @returns 优化建议与差异信息
   */
  @Post('resume-optimize')
  @UseGuards(RoleCapabilitiesGuard)
  @RequireCapability('canTriggerAiAnalysis')
  async optimizeResume(@Body() body: ResumeOptimizationBody) {
    const locale = body.locale ?? 'zh'
    const startedAt = Date.now()
    const providerSummary = this.aiService.getProviderSummary()
    const generator = providerSummary.mode === 'mock' ? 'mock-cache' : 'ai-provider'

    try {
      const result = await this.aiResumeOptimizationService.generateSuggestion(body)
      const usageRecord = await this.aiUsageRecordService.recordSuccess({
        operationType: 'resume-optimization',
        scenario: 'resume-review',
        locale,
        inputPreview: body.instruction,
        summary: result.summary,
        providerSummary,
        generator,
        relatedResultId: result.resultId,
        detail: {
          changedModules: result.changedModules,
          createdAt: result.createdAt,
          focusAreas: result.focusAreas,
          moduleDiffs: result.moduleDiffs,
          summary: result.summary,
        },
        durationMs: Date.now() - startedAt,
      })

      return {
        ...result,
        usageRecordId: usageRecord.id,
      }
    } catch (error) {
      await this.aiUsageRecordService.recordFailure({
        operationType: 'resume-optimization',
        scenario: 'resume-review',
        locale,
        inputPreview: body.instruction,
        providerSummary,
        generator,
        errorMessage:
          error instanceof Error ? error.message : 'Resume optimization request failed',
        durationMs: Date.now() - startedAt,
      })

      throw error
    }
  }

  @Get('resume-optimize/results/:resultId')
  getResumeOptimizationResult(
    @Param('resultId') resultId: string,
    @Query('locale') locale?: AnalysisLocale,
  ) {
    return this.aiResumeOptimizationService.getSuggestionResult(resultId, locale ?? 'zh')
  }

  /**
   * 应用简历优化建议并回写草稿
   * @param body 应用请求体
   * @returns 应用结果
   */
  @Post('resume-optimize/apply')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleCapabilitiesGuard)
  @RequireCapability('canEditResume')
  async applyResumeOptimization(@Body() body: ApplyResumeOptimizationBody) {
    return this.aiResumeOptimizationService.applySuggestion(body)
  }

  /**
   * 构建分析提示词
   * @param body 分析请求体
   * @returns 提示词文本
   */
  private buildAnalysisPrompt(body: CacheReportBody): string {
    if (body.locale === 'en') {
      return [
        `Scenario: ${body.scenario}`,
        'Task: analyze the current input for interview readiness and job-fit communication.',
        'Return JSON only. Do not wrap it in markdown.',
        'JSON shape:',
        JSON.stringify(
          {
            summary: 'string',
            score: {
              value: 78,
              label: 'string',
              reason: 'string',
            },
            strengths: ['string'],
            gaps: ['string'],
            risks: ['string'],
            suggestions: [
              {
                key: 'string',
                title: 'string',
                module: 'profile | experiences | projects | highlights | null',
                reason: 'string',
                actions: ['string'],
              },
            ],
          },
          null,
          2,
        ),
        'Keep the output concise and product-friendly.',
        `Input:\n${body.content}`,
      ].join('\n')
    }

    return [
      `分析场景：${body.scenario}`,
      '任务：从“更好投递、面试更有说服力、拿到 offer 更稳”这三个角度分析当前输入。',
      '请只返回 JSON，不要输出 markdown，不要输出代码块。',
      'JSON 结构：',
      JSON.stringify(
        {
          summary: 'string',
          score: {
            value: 78,
            label: 'string',
            reason: 'string',
          },
          strengths: ['string'],
          gaps: ['string'],
          risks: ['string'],
          suggestions: [
            {
              key: 'string',
              title: 'string',
              module: 'profile | experiences | projects | highlights | null',
              reason: 'string',
              actions: ['string'],
            },
          ],
        },
        null,
        2,
      ),
      '要求：strengths 说明已有优势，gaps 说明当前缺口，risks 说明不修改会带来的投递或面试风险，suggestions 给出可执行动作。',
      `输入内容：\n${body.content}`,
    ].join('\n')
  }

  /**
   * 构建分析系统提示词
   * @param locale 输出语言
   * @returns 系统提示词
   */
  private buildAnalysisSystemPrompt(locale: AnalysisLocale): string {
    // analyze 会成为“分析 -> 建议稿 -> diff -> apply”的上游，所以强制返回结构化 JSON。
    return locale === 'en'
      ? 'You are a resume analysis assistant. Output valid JSON only.'
      : '你是一个简历分析助手。只输出合法 JSON。'
  }
}
