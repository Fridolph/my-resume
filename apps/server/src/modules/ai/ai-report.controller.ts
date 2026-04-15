import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common'

import { RequireCapability } from '../auth/decorators/require-capability.decorator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RoleCapabilitiesGuard } from '../auth/guards/role-capabilities.guard'
import { AiService } from './ai.service'
import {
  ApplyResumeOptimizationInput,
  AiResumeOptimizationService,
  GenerateResumeOptimizationInput,
} from './ai-resume-optimization.service'
import {
  AnalysisLocale,
  AnalysisScenario,
  AnalysisReportCacheService,
} from './analysis-report-cache.service'

interface CacheReportBody {
  scenario: AnalysisScenario
  content: string
  locale?: AnalysisLocale
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
    // 分析流程：构造 prompt -> 调 provider -> 结构化缓存并返回。
    const result = await this.aiService.generateText({
      systemPrompt: this.buildAnalysisSystemPrompt(body.locale ?? 'zh'),
      prompt: this.buildAnalysisPrompt(body),
    })

    return {
      cached: false,
      report: this.analysisReportCacheService.storeGeneratedReport({
        ...body,
        generatedText: result.text,
        providerSummary: this.aiService.getProviderSummary(),
      }),
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
    // 仅生成 suggestion/diff/apply payload，落库由 apply 接口执行。
    return this.aiResumeOptimizationService.generateSuggestion(body)
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
