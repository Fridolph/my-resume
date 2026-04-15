import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { createHash } from 'node:crypto'

export type AnalysisScenario = 'jd-match' | 'resume-review' | 'offer-compare'
export type AnalysisLocale = 'zh' | 'en'
export type AnalysisSuggestionModule =
  | 'profile'
  | 'experiences'
  | 'projects'
  | 'highlights'

export interface AnalysisReportSection {
  key: string
  title: string
  bullets: string[]
}

export interface AnalysisScore {
  /**
   * 面向用户的快速判断分值，帮助先判断“当前内容离岗位要求还有多远”。
   * 它不是绝对分，只是把当前输入映射为一个更容易理解的优先级信号。
   */
  value: number
  /**
   * 配合分值一起展示的简短标签，用于降低用户阅读门槛。
   */
  label: string
  /**
   * 解释当前分值为何成立，是“让用户愿意相信结果”的第一层依据。
   */
  reason: string
}

export interface AnalysisSuggestion {
  key: string
  /**
   * 建议标题用于在前端卡片中快速扫读，不和底层字段名直接耦合。
   */
  title: string
  /**
   * 建议改动要尽可能指向简历模块，后续 diff / apply 才能按模块收口。
   * 非简历改写场景可为空，但 JD / 简历分析应尽量落到具体模块。
   */
  module?: AnalysisSuggestionModule
  /**
   * reason 不是给模型看的，而是给用户看的：为什么推荐改这个模块。
   */
  reason: string
  /**
   * actions 是前端可直接展示的可执行动作，避免只给抽象结论。
   */
  actions: string[]
}

export interface AnalysisReport {
  reportId: string
  cacheKey: string
  scenario: AnalysisScenario
  locale: AnalysisLocale
  sourceHash: string
  inputPreview: string
  /**
   * 结论层：给用户一个可以先读完的总判断。
   */
  summary: string
  /**
   * 结论层：快速评分与简短标签。
   */
  score: AnalysisScore
  /**
   * 依据层：当前输入已经命中的亮点。
   */
  strengths: string[]
  /**
   * 依据层：当前输入还未体现出来的缺口。
   */
  gaps: string[]
  /**
   * 依据层：如果不改，后续在投递和面试里容易产生的问题。
   */
  risks: string[]
  /**
   * 建议层：把分析结果收束成后续可用于 diff / apply 的动作入口。
   */
  suggestions: AnalysisSuggestion[]
  /**
   * 兼容当前缓存报告面板的过渡字段。
   * 本期前端主展示会转向 score / strengths / gaps / risks / suggestions，
   * 但缓存面板仍可通过 sections 平稳过渡，避免本 issue 一次性打碎所有界面。
   */
  sections: AnalysisReportSection[]
  generator: 'mock-cache' | 'ai-provider'
  createdAt: string
}

export interface GetOrCreateReportInput {
  scenario: AnalysisScenario
  content: string
  locale?: AnalysisLocale
}

export interface CachedAnalysisReportResult {
  cached: boolean
  report: AnalysisReport
}

interface StoreGeneratedReportInput extends GetOrCreateReportInput {
  generatedText: string
  providerSummary: {
    provider: string
    model: string
    mode: string
  }
}

interface StructuredAnalysisPayload {
  summary: string
  score: AnalysisScore
  strengths: string[]
  gaps: string[]
  risks: string[]
  suggestions: AnalysisSuggestion[]
}

const SUPPORTED_SCENARIOS = new Set<AnalysisScenario>([
  'jd-match',
  'resume-review',
  'offer-compare',
])

const SUPPORTED_SUGGESTION_MODULES = new Set<AnalysisSuggestionModule>([
  'profile',
  'experiences',
  'projects',
  'highlights',
])

function normalizeContent(content: string): string {
  return content.replace(/\s+/g, ' ').trim()
}

function computeHash(content: string): string {
  return createHash('sha256').update(content).digest('hex')
}

function buildInputPreview(content: string): string {
  return content.slice(0, 120)
}

function extractKeywords(content: string, locale: AnalysisLocale): string[] {
  const englishMatches = content.match(/[A-Za-z0-9.+#-]{2,}/g) ?? []
  const chineseMatches = content.match(/[\u4e00-\u9fa5]{2,}/g) ?? []
  const unique = Array.from(
    new Set([...englishMatches, ...chineseMatches].map((item) => item.trim())),
  )

  if (unique.length > 0) {
    return unique.slice(0, 4)
  }

  return locale === 'en' ? ['resume', 'impact', 'delivery'] : ['简历', '结果', '交付']
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function buildScoreLabel(value: number, locale: AnalysisLocale): string {
  if (locale === 'en') {
    if (value >= 85) {
      return 'Highly aligned'
    }

    if (value >= 70) {
      return 'Strong baseline'
    }

    if (value >= 55) {
      return 'Needs reinforcement'
    }

    return 'Needs major revision'
  }

  if (value >= 85) {
    return '高度匹配'
  }

  if (value >= 70) {
    return '基础匹配良好'
  }

  if (value >= 55) {
    return '需要继续补强'
  }

  return '需要重点调整'
}

function extractJsonObject(rawText: string): string {
  const fencedMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/i)

  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim()
  }

  const firstBrace = rawText.indexOf('{')
  const lastBrace = rawText.lastIndexOf('}')

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new BadGatewayException('AI 未返回可解析的 JSON 结果')
  }

  return rawText.slice(firstBrace, lastBrace + 1).trim()
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function normalizeSuggestionModule(value: unknown): AnalysisSuggestionModule | undefined {
  if (value == null) {
    return undefined
  }

  if (
    typeof value === 'string' &&
    SUPPORTED_SUGGESTION_MODULES.has(value as AnalysisSuggestionModule)
  ) {
    return value as AnalysisSuggestionModule
  }

  throw new BadGatewayException('AI 返回的建议模块无效')
}

function sanitizeActionList(actions: string[], locale: AnalysisLocale): string[] {
  const normalized = actions.map((action) => action.trim()).filter(Boolean)

  if (normalized.length > 0) {
    return normalized.slice(0, 3)
  }

  return locale === 'en'
    ? ['Add one quantified result', 'Clarify one ownership boundary']
    : ['补一条量化结果', '补一条职责边界说明']
}

function validateStructuredAnalysisPayload(
  value: unknown,
  locale: AnalysisLocale,
): StructuredAnalysisPayload {
  if (!value || typeof value !== 'object') {
    throw new BadGatewayException('AI 返回的分析结构无效')
  }

  const candidate = value as Record<string, unknown>

  if (typeof candidate.summary !== 'string' || !candidate.summary.trim()) {
    throw new BadGatewayException('AI 返回的分析摘要无效')
  }

  const scoreCandidate = candidate.score

  if (!scoreCandidate || typeof scoreCandidate !== 'object') {
    throw new BadGatewayException('AI 返回的评分结构无效')
  }

  const scoreRecord = scoreCandidate as Record<string, unknown>

  if (
    typeof scoreRecord.value !== 'number' ||
    typeof scoreRecord.label !== 'string' ||
    typeof scoreRecord.reason !== 'string'
  ) {
    throw new BadGatewayException('AI 返回的评分字段无效')
  }

  if (!isStringArray(candidate.strengths)) {
    throw new BadGatewayException('AI 返回的 strengths 字段无效')
  }

  if (!isStringArray(candidate.gaps)) {
    throw new BadGatewayException('AI 返回的 gaps 字段无效')
  }

  if (!isStringArray(candidate.risks)) {
    throw new BadGatewayException('AI 返回的 risks 字段无效')
  }

  if (!Array.isArray(candidate.suggestions)) {
    throw new BadGatewayException('AI 返回的 suggestions 字段无效')
  }

  const suggestions = candidate.suggestions.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new BadGatewayException('AI 返回的建议项结构无效')
    }

    const suggestion = item as Record<string, unknown>

    if (
      typeof suggestion.title !== 'string' ||
      typeof suggestion.reason !== 'string' ||
      !isStringArray(suggestion.actions)
    ) {
      throw new BadGatewayException('AI 返回的建议项字段无效')
    }

    return {
      key:
        typeof suggestion.key === 'string' && suggestion.key.trim()
          ? suggestion.key.trim()
          : `suggestion-${index + 1}`,
      title: suggestion.title.trim(),
      module: normalizeSuggestionModule(suggestion.module),
      reason: suggestion.reason.trim(),
      actions: sanitizeActionList(suggestion.actions, locale),
    }
  })

  return {
    summary: candidate.summary.trim(),
    score: {
      value: clampScore(scoreRecord.value),
      label: scoreRecord.label.trim(),
      reason: scoreRecord.reason.trim(),
    },
    strengths: candidate.strengths.map((item) => item.trim()).filter(Boolean),
    gaps: candidate.gaps.map((item) => item.trim()).filter(Boolean),
    risks: candidate.risks.map((item) => item.trim()).filter(Boolean),
    suggestions,
  }
}

function buildMockStructuredPayload(
  scenario: AnalysisScenario,
  keywords: string[],
  locale: AnalysisLocale,
): StructuredAnalysisPayload {
  if (locale === 'en') {
    if (scenario === 'jd-match') {
      return {
        summary: `The current input already aligns with ${keywords.join(', ')}, but the resume still needs clearer business outcomes to become more convincing.`,
        score: {
          value: 78,
          label: buildScoreLabel(78, locale),
          reason:
            'Core skill keywords are visible, but quantified impact and ownership are still under-expressed.',
        },
        strengths: [
          `The input already mentions ${keywords[0]} and ${keywords[1] ?? keywords[0]}.`,
          'The overall direction is already close to the target role.',
        ],
        gaps: [
          'There is not enough quantified delivery impact yet.',
          'Business context and collaboration scope still need sharper wording.',
        ],
        risks: [
          'Listing technologies alone may look like tool exposure rather than deep ownership.',
        ],
        suggestions: [
          {
            key: 'profile-positioning',
            module: 'profile',
            title: 'Tighten the top-level positioning',
            reason:
              'The profile summary is the fastest place to tell recruiters what role this resume is optimized for.',
            actions: [
              'Add one role-focused headline',
              'Add one sentence with business impact',
            ],
          },
          {
            key: 'project-impact',
            module: 'projects',
            title: 'Strengthen project outcomes',
            reason:
              'Projects are where matching keywords should be connected to business value and delivery results.',
            actions: ['Add one quantified outcome', 'Clarify one ownership boundary'],
          },
        ],
      }
    }

    if (scenario === 'resume-review') {
      return {
        summary:
          'The resume already has a solid technical baseline, but it still needs stronger impact framing before it feels interview-ready.',
        score: {
          value: 76,
          label: buildScoreLabel(76, locale),
          reason:
            'Technical coverage exists, but the resume still under-explains outcomes, ownership, and differentiation.',
        },
        strengths: [
          `The resume already exposes keywords like ${keywords.join(', ')}.`,
          'The bilingual structure is already suitable for later polishing.',
        ],
        gaps: [
          'Each major project still needs a clearer strongest-result sentence.',
          'The top summary does not yet fully reflect role positioning.',
        ],
        risks: [
          'Without explicit impact statements, the resume may look execution-only.',
        ],
        suggestions: [
          {
            key: 'profile-summary',
            module: 'profile',
            title: 'Refine the profile summary first',
            reason:
              'The summary is the fastest place to establish positioning and value before readers enter detailed sections.',
            actions: [
              'Add one role-oriented summary sentence',
              'Mention one representative achievement',
            ],
          },
          {
            key: 'experience-impact',
            module: 'experiences',
            title: 'Add measurable experience impact',
            reason:
              'Experience entries carry the most trust in interview screening and should show scope plus results.',
            actions: [
              'Add one quantified result',
              'Clarify one owned module or initiative',
            ],
          },
        ],
      }
    }

    return {
      summary:
        'The current offer comparison is enough for a demo walkthrough, but a real decision still needs clearer trade-offs and personal priorities.',
      score: {
        value: 68,
        label: buildScoreLabel(68, locale),
        reason:
          'Comparison dimensions are present, but the decision criteria still need stronger prioritization.',
      },
      strengths: [
        `The current comparison already covers ${keywords.join(', ')} as useful dimensions.`,
      ],
      gaps: [
        'The input does not yet rank growth, ownership, and compensation priorities clearly.',
      ],
      risks: [
        'If salary becomes the only lens, the final recommendation may be misleading.',
      ],
      suggestions: [
        {
          key: 'decision-priority',
          title: 'Clarify the decision priority first',
          reason:
            'Offer comparison becomes more reliable when growth path, ownership, and compensation are explicitly ordered.',
          actions: [
            'Rank your top three decision factors',
            'Write one risk you are unwilling to accept',
          ],
        },
      ],
    }
  }

  if (scenario === 'jd-match') {
    return {
      summary: `当前输入已经覆盖 ${keywords.join('、')} 等关键信号，但要真正提升命中率，还需要把技术关键词落到结果与职责上。`,
      score: {
        value: 78,
        label: buildScoreLabel(78, locale),
        reason:
          '当前已具备核心关键词基础，但量化结果、业务影响和主导范围表达还不够充分。',
      },
      strengths: [
        `已覆盖 ${keywords[0]}、${keywords[1] ?? keywords[0]} 等目标岗位关键词。`,
        '整体方向已经接近目标岗位，不需要从零重写。',
      ],
      gaps: ['缺少量化结果来证明交付价值。', '缺少对业务背景与协作边界的说明。'],
      risks: ['如果只写技术栈，容易被理解为使用过工具而不是形成过主导能力。'],
      suggestions: [
        {
          key: 'profile-positioning',
          module: 'profile',
          title: '先对齐顶部定位',
          reason: '个人摘要是招聘方最快形成第一印象的入口，应先说明你与岗位的贴合点。',
          actions: ['补一条岗位定位句', '补一条代表性结果描述'],
        },
        {
          key: 'project-impact',
          module: 'projects',
          title: '补强项目结果表达',
          reason: 'JD 更关心“做过什么并产生了什么结果”，项目模块最适合承载这类信息。',
          actions: ['补一条量化结果', '补一条主导职责描述'],
        },
      ],
    }
  }

  if (scenario === 'resume-review') {
    return {
      summary:
        '当前简历已经具备基础竞争力，但在面试前还需要进一步把成果、定位和差异化讲清楚。',
      score: {
        value: 76,
        label: buildScoreLabel(76, locale),
        reason: '技术覆盖已经具备，但简历对结果、主导范围和岗位定位的解释仍有提升空间。',
      },
      strengths: [
        `已覆盖 ${keywords.join('、')} 等核心关键词。`,
        '双语结构已经具备，适合继续做更细的针对性优化。',
      ],
      gaps: [
        '缺少最能代表竞争力的量化成果。',
        '顶部摘要还没有完全体现岗位定位与个人优势。',
      ],
      risks: ['如果没有明确主导范围，容易在筛选时被理解为参与执行而不是负责推进。'],
      suggestions: [
        {
          key: 'profile-summary',
          module: 'profile',
          title: '先优化个人摘要',
          reason: '摘要是 HR 与面试官最快读取的入口，应先突出定位与结果。',
          actions: ['补一条面向岗位的定位句', '加入一条代表性结果描述'],
        },
        {
          key: 'experience-impact',
          module: 'experiences',
          title: '补强经历成果描述',
          reason: '工作经历是最能证明能力与影响范围的模块，需要更具体的结果与职责信息。',
          actions: ['补一条量化结果', '补一条主导职责描述'],
        },
      ],
    }
  }

  return {
    summary:
      '当前 offer 对比已经能形成初步判断，但要做更稳的决策，还需要先明确个人优先级与不能接受的风险。',
    score: {
      value: 68,
      label: buildScoreLabel(68, locale),
      reason: '当前对比维度已经有基础，但个人优先级与取舍依据还不够明确。',
    },
    strengths: [`当前已围绕 ${keywords.join('、')} 等维度形成基础对比框架。`],
    gaps: ['还没有清晰排序成长空间、职责边界、薪资福利等个人优先级。'],
    risks: ['如果只比较薪资，很容易忽略成长机会与岗位边界带来的长期影响。'],
    suggestions: [
      {
        key: 'decision-priority',
        title: '先确认决策优先级',
        reason: '只有先明确你最重视什么，后续的 offer 建议才会更可信。',
        actions: ['写下最重要的三个取舍维度', '补充一个绝对不能接受的风险点'],
      },
    ],
  }
}

function sanitizeGeneratedSummary(
  generatedText: string,
  locale: AnalysisLocale,
  fallbackSummary: string,
): string {
  const normalized = generatedText.replace(/\s+/g, ' ').trim()

  if (!normalized || normalized.startsWith('Mock AI response')) {
    return fallbackSummary
  }

  const maxLength = locale === 'en' ? 220 : 120
  return normalized.slice(0, maxLength)
}

function buildFallbackGeneratedPayload(input: {
  scenario: AnalysisScenario
  locale: AnalysisLocale
  keywords: string[]
  generatedText: string
}): StructuredAnalysisPayload {
  const mockPayload = buildMockStructuredPayload(
    input.scenario,
    input.keywords,
    input.locale,
  )

  return {
    ...mockPayload,
    summary: sanitizeGeneratedSummary(
      input.generatedText,
      input.locale,
      mockPayload.summary,
    ),
  }
}

function buildSectionsFromStructuredPayload(
  payload: StructuredAnalysisPayload,
  locale: AnalysisLocale,
): AnalysisReportSection[] {
  return [
    {
      key: 'conclusion',
      title: locale === 'en' ? 'Conclusion' : '结论摘要',
      bullets: [
        payload.summary,
        locale === 'en'
          ? `Score: ${payload.score.value} / 100 · ${payload.score.label}`
          : `评分：${payload.score.value} / 100 · ${payload.score.label}`,
        payload.score.reason,
      ],
    },
    {
      key: 'evidence',
      title: locale === 'en' ? 'Evidence' : '判断依据',
      bullets: [
        ...payload.strengths.map((item) =>
          locale === 'en' ? `Strength: ${item}` : `优势：${item}`,
        ),
        ...payload.gaps.map((item) =>
          locale === 'en' ? `Gap: ${item}` : `缺口：${item}`,
        ),
      ].slice(0, 6),
    },
    {
      key: 'risks',
      title: locale === 'en' ? 'Risks' : '风险提示',
      bullets: payload.risks,
    },
    {
      key: 'suggestions',
      title: locale === 'en' ? 'Suggestions' : '建议动作',
      bullets: payload.suggestions.flatMap((item) => [
        item.module
          ? locale === 'en'
            ? `${item.title} (${item.module})`
            : `${item.title}（${item.module}）`
          : item.title,
        item.reason,
        ...item.actions,
      ]),
    },
  ]
}

function buildReportFromPayload(input: {
  scenario: AnalysisScenario
  locale: AnalysisLocale
  normalizedContent: string
  sourceHash: string
  cacheKey: string
  generator: AnalysisReport['generator']
  payload: StructuredAnalysisPayload
}): AnalysisReport {
  return {
    reportId: `${input.scenario}-${input.sourceHash.slice(0, 12)}`,
    cacheKey: input.cacheKey,
    scenario: input.scenario,
    locale: input.locale,
    sourceHash: input.sourceHash,
    inputPreview: buildInputPreview(input.normalizedContent),
    summary: input.payload.summary,
    score: input.payload.score,
    strengths: input.payload.strengths,
    gaps: input.payload.gaps,
    risks: input.payload.risks,
    suggestions: input.payload.suggestions,
    sections: buildSectionsFromStructuredPayload(input.payload, input.locale),
    generator: input.generator,
    createdAt: new Date().toISOString(),
  }
}

@Injectable()
export class AnalysisReportCacheService {
  private readonly cache = new Map<string, AnalysisReport>()
  private readonly reportIndex = new Map<string, AnalysisReport>()

  getOrCreateReport(input: GetOrCreateReportInput): CachedAnalysisReportResult {
    const scenario = this.validateScenario(input.scenario)
    const locale = this.validateLocale(input.locale ?? 'zh')
    const normalizedContent = normalizeContent(input.content)

    if (!normalizedContent) {
      throw new BadRequestException('Content is required')
    }

    const sourceHash = computeHash(normalizedContent)
    const cacheKey = `${scenario}:${locale}:${sourceHash}`
    const cachedReport = this.cache.get(cacheKey)

    if (cachedReport) {
      return {
        cached: true,
        report: cachedReport,
      }
    }

    const keywords = extractKeywords(normalizedContent, locale)
    const payload = buildMockStructuredPayload(scenario, keywords, locale)
    const report = buildReportFromPayload({
      scenario,
      locale,
      normalizedContent,
      sourceHash,
      cacheKey,
      generator: 'mock-cache',
      payload,
    })

    this.cache.set(cacheKey, report)
    this.reportIndex.set(report.reportId, report)

    return {
      cached: false,
      report,
    }
  }

  storeGeneratedReport(input: StoreGeneratedReportInput): AnalysisReport {
    const scenario = this.validateScenario(input.scenario)
    const locale = this.validateLocale(input.locale ?? 'zh')
    const normalizedContent = normalizeContent(input.content)

    if (!normalizedContent) {
      throw new BadRequestException('Content is required')
    }

    const sourceHash = computeHash(normalizedContent)
    const cacheKey = `${scenario}:${locale}:${sourceHash}`
    const keywords = extractKeywords(normalizedContent, locale)
    const payload = this.resolveGeneratedPayload({
      scenario,
      locale,
      keywords,
      generatedText: input.generatedText,
    })

    const report = buildReportFromPayload({
      scenario,
      locale,
      normalizedContent,
      sourceHash,
      cacheKey,
      generator: 'ai-provider',
      payload,
    })

    this.cache.set(cacheKey, report)
    this.reportIndex.set(report.reportId, report)

    return report
  }

  listReports() {
    this.ensureDemoReports()

    return Array.from(this.reportIndex.values())
      .sort((left, right) => left.reportId.localeCompare(right.reportId))
      .map((report) => ({
        reportId: report.reportId,
        scenario: report.scenario,
        locale: report.locale,
        summary: report.summary,
        generator: report.generator,
        createdAt: report.createdAt,
      }))
  }

  getReportById(reportId: string): AnalysisReport {
    this.ensureDemoReports()

    const report = this.reportIndex.get(reportId)

    if (!report) {
      throw new NotFoundException('Cached analysis report not found')
    }

    return report
  }

  private resolveGeneratedPayload(input: {
    scenario: AnalysisScenario
    locale: AnalysisLocale
    keywords: string[]
    generatedText: string
  }): StructuredAnalysisPayload {
    try {
      return validateStructuredAnalysisPayload(
        JSON.parse(extractJsonObject(input.generatedText)),
        input.locale,
      )
    } catch {
      return buildFallbackGeneratedPayload(input)
    }
  }

  private validateScenario(scenario: string): AnalysisScenario {
    if (!SUPPORTED_SCENARIOS.has(scenario as AnalysisScenario)) {
      throw new BadRequestException(`Unsupported analysis scenario: ${scenario}`)
    }

    return scenario as AnalysisScenario
  }

  private validateLocale(locale: string): AnalysisLocale {
    if (locale !== 'zh' && locale !== 'en') {
      throw new BadRequestException(`Unsupported locale: ${locale}`)
    }

    return locale
  }

  private ensureDemoReports() {
    if (this.reportIndex.size > 0) {
      return
    }

    this.getOrCreateReport({
      scenario: 'jd-match',
      content: 'NestJS React TypeScript Redis BullMQ',
      locale: 'zh',
    })
    this.getOrCreateReport({
      scenario: 'resume-review',
      content: 'Resume review for bilingual full-stack engineer',
      locale: 'en',
    })
    this.getOrCreateReport({
      scenario: 'offer-compare',
      content: 'Growth ownership salary team culture',
      locale: 'zh',
    })
  }
}
