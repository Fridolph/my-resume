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
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'

import { ApiEnvelopeResponse } from '../../../../common/swagger/api-envelope-response.decorator'

import { RequireCapability } from '../../../auth/decorators/require-capability.decorator'
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard'
import { RoleCapabilitiesGuard } from '../../../auth/guards/role-capabilities.guard'
import {
  AnalysisReportCacheService,
  AnalysisScenario,
} from '../../application/services/analysis-report-cache.service'
import { AiResumeOptimizationService } from '../../application/services/ai-resume-optimization.service'
import { AiService } from '../../application/services/ai.service'
import {
  AiUsageRecordFilterType,
  AiUsageRecordService,
} from '../../application/services/ai-usage-record.service'
import type { AnalysisLocale } from '../../application/services/analysis-report-cache.service'
import {
  AnalyzeReportResultDto,
  ApplyResumeOptimizationBodyDto,
  CacheReportBodyDto,
  CachedReportListDto,
  ResumeOptimizationBodyDto,
  ResumeOptimizationResultDto,
  RuntimeSummaryDto,
  UsageHistoryListDto,
  UsageHistoryQueryDto,
} from '../dto/ai-report-swagger.dto'

const SUPPORTED_SCENARIOS: AnalysisScenario[] = [
  'jd-match',
  'resume-review',
  'offer-compare',
]

@Controller('ai/reports')
@UseGuards(JwtAuthGuard)
@ApiTags('AI Reports')
@ApiBearerAuth('bearer')
@ApiUnauthorizedResponse({
  description: '未提供有效 Bearer Token',
})
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
  @ApiOperation({
    summary: '获取缓存分析报告列表',
    description: '返回当前缓存中的分析报告元数据',
  })
  @ApiEnvelopeResponse({
    description: '读取缓存报告列表成功',
    type: CachedReportListDto,
  })
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
  @ApiOperation({
    summary: '获取 AI 运行时摘要',
    description: '返回 provider、model、mode 及支持场景',
  })
  @ApiEnvelopeResponse({
    description: '读取运行时摘要成功',
    type: RuntimeSummaryDto,
  })
  getRuntimeSummary() {
    // 先暴露 provider/model 摘要，便于教学演示和运行态排查。
    return {
      ...this.aiService.getProviderSummary(),
      supportedScenarios: SUPPORTED_SCENARIOS,
    }
  }

  @Get('history')
  @ApiOperation({
    summary: '查询 AI 调用历史',
    description: '按类型筛选并返回最近调用记录',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: '返回数量上限，默认 20',
    example: '20',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['all', 'analysis-report', 'resume-optimization'] satisfies AiUsageRecordFilterType[],
    description: '历史类型筛选',
  })
  @ApiEnvelopeResponse({
    description: '读取 AI 调用历史成功',
    type: UsageHistoryListDto,
  })
  async listUsageHistory(@Query() query: UsageHistoryQueryDto) {
    return {
      records: await this.aiUsageRecordService.listHistory({
        type: query.type ?? 'all',
        limit: query.limit ? Number(query.limit) : undefined,
      }),
    }
  }

  @Get('history/:recordId')
  @ApiOperation({
    summary: '获取 AI 调用历史详情',
    description: '根据记录 ID 返回完整历史详情',
  })
  @ApiParam({
    name: 'recordId',
    description: '历史记录 ID',
    example: 'usage-record-123',
  })
  @ApiEnvelopeResponse({
    description: '读取 AI 调用历史详情成功',
  })
  @ApiNotFoundResponse({
    description: '历史记录不存在',
  })
  async getUsageHistoryDetail(@Param('recordId') recordId: string) {
    return this.aiUsageRecordService.getDetail(recordId)
  }

  @Post('cache')
  @UseGuards(RoleCapabilitiesGuard)
  @RequireCapability('canTriggerAiAnalysis')
  @ApiOperation({
    summary: '缓存分析报告',
    description: '按场景和内容缓存结构化分析结果',
  })
  @ApiEnvelopeResponse({
    description: '缓存分析报告成功',
  })
  @ApiForbiddenResponse({
    description: '当前角色没有触发 AI 分析权限',
  })
  cacheReport(@Body() body: CacheReportBodyDto) {
    return this.analysisReportCacheService.getOrCreateReport(body)
  }

  @Get('cache/:reportId')
  @ApiOperation({
    summary: '获取缓存分析报告详情',
    description: '根据 reportId 读取已缓存的报告详情',
  })
  @ApiParam({
    name: 'reportId',
    description: '报告 ID',
    example: 'report-123',
  })
  @ApiEnvelopeResponse({
    description: '读取缓存分析报告成功',
  })
  @ApiNotFoundResponse({
    description: '报告不存在',
  })
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
  @ApiOperation({
    summary: '执行分析并写入缓存',
    description: '调用 AI 生成结构化结果并关联 usage 记录',
  })
  @ApiEnvelopeResponse({
    description: '分析成功',
    type: AnalyzeReportResultDto,
  })
  @ApiBadRequestResponse({
    description: '请求体参数不合法',
  })
  @ApiForbiddenResponse({
    description: '当前角色没有触发 AI 分析权限',
  })
  async analyzeReport(@Body() body: CacheReportBodyDto) {
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
  @ApiOperation({
    summary: '生成简历优化建议',
    description: '输出建议摘要、模块 diff 与后续 apply 所需结果 ID',
  })
  @ApiEnvelopeResponse({
    description: '生成简历优化建议成功',
    type: ResumeOptimizationResultDto,
  })
  @ApiBadRequestResponse({
    description: '请求体参数不合法',
  })
  @ApiForbiddenResponse({
    description: '当前角色没有触发 AI 分析权限',
  })
  async optimizeResume(@Body() body: ResumeOptimizationBodyDto) {
    const locale = body.locale ?? 'zh'
    const startedAt = Date.now()
    const providerSummary = this.aiService.getProviderSummary()
    const generator = providerSummary.mode === 'mock' ? 'mock-cache' : 'ai-provider'

    try {
      const result = await this.aiResumeOptimizationService.generateSuggestion(body)
      const persistedSnapshot =
        this.aiResumeOptimizationService.getSuggestionSnapshotForPersistence(
          result.resultId,
          locale,
        )
      const usageRecord = await this.aiUsageRecordService.recordSuccess({
        operationType: 'resume-optimization',
        scenario: 'resume-review',
        locale,
        inputPreview: body.instruction,
        summary: result.summary,
        providerSummary,
        generator,
        relatedResultId: result.resultId,
        detail: persistedSnapshot,
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
  @ApiOperation({
    summary: '获取简历优化结果详情',
    description: '按 resultId 读取优化结果，供详情页和 apply 前确认使用',
  })
  @ApiParam({
    name: 'resultId',
    description: '优化结果 ID',
    example: 'result-123',
  })
  @ApiQuery({
    name: 'locale',
    required: false,
    enum: ['zh', 'en'] satisfies AnalysisLocale[],
    description: '返回语言，默认 zh',
  })
  @ApiEnvelopeResponse({
    description: '读取简历优化结果成功',
  })
  @ApiNotFoundResponse({
    description: '优化结果不存在或已过期',
  })
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
  @ApiOperation({
    summary: '应用简历优化建议',
    description: '将选中模块的 patch 应用到当前草稿并持久化',
  })
  @ApiEnvelopeResponse({
    description: '应用简历优化建议成功',
  })
  @ApiBadRequestResponse({
    description: '模块选择无效或建议内容无法应用',
  })
  @ApiConflictResponse({
    description: '草稿已更新，需要重新生成建议稿',
  })
  @ApiForbiddenResponse({
    description: '当前角色没有编辑简历权限',
  })
  @ApiNotFoundResponse({
    description: '优化结果不存在或已失效',
  })
  async applyResumeOptimization(@Body() body: ApplyResumeOptimizationBodyDto) {
    return this.aiResumeOptimizationService.applySuggestion(body)
  }

  /**
   * 构建分析提示词
   * @param body 分析请求体
   * @returns 提示词文本
   */
  private buildAnalysisPrompt(body: CacheReportBodyDto): string {
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
