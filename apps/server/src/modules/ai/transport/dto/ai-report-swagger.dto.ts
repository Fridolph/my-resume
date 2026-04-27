import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

import type { ResumeOptimizationModule } from '../../application/services/ai-resume-optimization.service'
import type { AnalysisLocale, AnalysisScenario } from '../../application/services/analysis-report-cache.service'
import type { AiUsageRecordFilterType } from '../../application/services/ai-usage-record.service'

const ANALYSIS_SCENARIO_ENUM: AnalysisScenario[] = [
  'jd-match',
  'resume-review',
  'offer-compare',
]

const ANALYSIS_LOCALE_ENUM: AnalysisLocale[] = ['zh', 'en']

const USAGE_RECORD_TYPE_ENUM: AiUsageRecordFilterType[] = [
  'all',
  'analysis-report',
  'resume-optimization',
]

const RESUME_OPTIMIZATION_MODULE_ENUM: ResumeOptimizationModule[] = [
  'profile',
  'experiences',
  'projects',
  'highlights',
]

export class CacheReportBodyDto {
  @ApiProperty({
    description: '分析场景',
    enum: ANALYSIS_SCENARIO_ENUM,
    example: 'resume-review',
  })
  scenario!: AnalysisScenario

  @ApiProperty({
    description: '待分析内容',
    example: '5 年前端经验，负责中后台系统和简历重构项目',
  })
  content!: string

  @ApiPropertyOptional({
    description: '输出语言',
    enum: ANALYSIS_LOCALE_ENUM,
    example: 'zh',
  })
  locale?: AnalysisLocale
}

export class UsageHistoryQueryDto {
  @ApiPropertyOptional({
    description: '返回数量上限，最大 50',
    example: '20',
  })
  limit?: string

  @ApiPropertyOptional({
    description: '过滤类型',
    enum: USAGE_RECORD_TYPE_ENUM,
    example: 'all',
  })
  type?: AiUsageRecordFilterType
}

export class ResumeOptimizationBodyDto {
  @ApiProperty({
    description: '优化指令',
    example: '强调技术深度和业务结果，减少泛化描述',
  })
  instruction!: string

  @ApiPropertyOptional({
    description: '输出语言',
    enum: ANALYSIS_LOCALE_ENUM,
    example: 'zh',
  })
  locale?: AnalysisLocale
}

export class ApplyResumeOptimizationBodyDto {
  @ApiProperty({
    description: '优化结果 ID',
    example: 'result-123456',
  })
  resultId!: string

  @ApiProperty({
    description: '要应用的模块',
    isArray: true,
    enum: RESUME_OPTIMIZATION_MODULE_ENUM,
    example: ['profile', 'projects'],
  })
  modules!: ResumeOptimizationModule[]
}

export class RuntimeSummaryDto {
  @ApiProperty({
    description: '当前 provider',
    example: 'openai-compatible',
  })
  provider!: string

  @ApiProperty({
    description: '当前模型',
    example: 'gpt-4o-mini',
  })
  model!: string

  @ApiProperty({
    description: '当前运行模式',
    example: 'mock',
  })
  mode!: string

  @ApiProperty({
    description: '支持的分析场景',
    isArray: true,
    enum: ANALYSIS_SCENARIO_ENUM,
    example: ['resume-review', 'jd-match'],
  })
  supportedScenarios!: AnalysisScenario[]
}

export class CachedReportListDto {
  @ApiProperty({
    description: '缓存报告列表',
    isArray: true,
    type: Object,
  })
  reports!: Record<string, unknown>[]
}

export class UsageHistoryListDto {
  @ApiProperty({
    description: '历史记录列表',
    isArray: true,
    type: Object,
  })
  records!: Record<string, unknown>[]
}

export class AnalyzeReportResultDto {
  @ApiProperty({
    description: '本次请求是否命中缓存',
    example: false,
  })
  cached!: boolean

  @ApiProperty({
    description: '分析报告主体',
    type: Object,
  })
  report!: Record<string, unknown>

  @ApiProperty({
    description: '关联用量记录 ID',
    example: 'usage-record-123',
  })
  usageRecordId!: string
}

export class ResumeOptimizationResultDto {
  @ApiProperty({
    description: '优化结果 ID',
    example: 'result-123456',
  })
  resultId!: string

  @ApiProperty({
    description: '输出语言',
    enum: ANALYSIS_LOCALE_ENUM,
    example: 'zh',
  })
  locale!: AnalysisLocale

  @ApiProperty({
    description: '优化摘要',
    example: '建议优先补强项目成果量化与职责边界表达',
  })
  summary!: string

  @ApiProperty({
    description: '建议关注点',
    isArray: true,
    type: 'string',
  })
  focusAreas!: string[]

  @ApiProperty({
    description: '发生改动的模块',
    isArray: true,
    enum: RESUME_OPTIMIZATION_MODULE_ENUM,
  })
  changedModules!: ResumeOptimizationModule[]

  @ApiProperty({
    description: '模块级 diff',
    isArray: true,
    type: Object,
  })
  moduleDiffs!: Record<string, unknown>[]

  @ApiProperty({
    description: '创建时间',
    example: '2026-04-20T12:00:00.000Z',
  })
  createdAt!: string

  @ApiProperty({
    description: 'Provider 摘要',
    type: Object,
  })
  providerSummary!: Record<string, unknown>

  @ApiProperty({
    description: '关联用量记录 ID',
    example: 'usage-record-123',
  })
  usageRecordId!: string
}
