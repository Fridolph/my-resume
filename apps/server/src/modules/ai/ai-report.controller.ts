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

  @Get('runtime')
  getRuntimeSummary() {
    /**
     * 让前端先知道“当前到底接的是哪个 provider / model”，
     * 便于教学演示和问题排查。
     */
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

  @Post('analyze')
  @UseGuards(RoleCapabilitiesGuard)
  @RequireCapability('canTriggerAiAnalysis')
  async analyzeReport(@Body() body: CacheReportBody) {
    /**
     * 分析链路：
     * 1. controller 构造结构化 prompt
     * 2. AiService 调 provider 生成文本
     * 3. 再交给缓存服务收成当前前端可消费的 report 结构
     */
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

  @Post('resume-optimize')
  @UseGuards(RoleCapabilitiesGuard)
  @RequireCapability('canTriggerAiAnalysis')
  async optimizeResume(@Body() body: ResumeOptimizationBody) {
    /**
     * 这里不直接写库，只生成 suggestion / diff / apply payload，
     * 真正落草稿在下一步 /resume-optimize/apply 中完成。
     */
    return this.aiResumeOptimizationService.generateSuggestion(body)
  }

  @Post('resume-optimize/apply')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleCapabilitiesGuard)
  @RequireCapability('canEditResume')
  async applyResumeOptimization(@Body() body: ApplyResumeOptimizationBody) {
    return this.aiResumeOptimizationService.applySuggestion(body)
  }

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

  private buildAnalysisSystemPrompt(locale: AnalysisLocale): string {
    /**
     * analyze 接口后续会成为“分析 -> 建议稿 -> diff -> apply”的上游输入，
     * 所以这里强制要求结构化 JSON，而不是让前端从自由文本里猜字段。
     */
    return locale === 'en'
      ? 'You are a resume analysis assistant. Output valid JSON only.'
      : '你是一个简历分析助手。只输出合法 JSON。'
  }
}
