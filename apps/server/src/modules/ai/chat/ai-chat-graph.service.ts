import { Inject, Injectable, Logger } from '@nestjs/common'

import { ResumePublicationService } from '../../resume/application/services/resume-publication.service'
import type {
  LocalizedText,
  ResumeExperienceItem,
  ResumeProjectItem,
  StandardResume,
} from '../../resume/domain/standard-resume'
import { AiService } from '../application/services/ai.service'
import type { RagKnowledgeDomain } from '../rag/rag-knowledge-domain'
import { buildRagAskSystemPrompt } from '../rag/prompts/rag-ask.prompt'
import { RagCatalogProbeHit, RagService } from '../rag/rag.service'
import type { RagAskCitation, RagRetrievalSourceType } from '../rag/rag.types'
import type {
  AiChatAnswerGenerationResult,
  AiChatExperienceCardBlock,
  AiChatLocale,
  AiChatMessageBlock,
  AiChatProjectCardBlock,
} from './ai-chat.types'

const DEFAULT_CHAT_LIMIT = 15
const MAX_LOG_SNIPPET_LENGTH = 120

type QuestionClass = 'greeting' | 'short' | 'negative' | 'normal'
type GraphRouteIntent = 'direct' | 'rag' | 'blocked'
type GraphRouteKind = 'direct' | 'resume_only' | 'supplement_only' | 'hybrid' | 'reject'

interface AiChatGraphInput {
  locale: AiChatLocale
  question: string
  onToken?: (token: string) => void
}

interface NormalizedGraphInput extends AiChatGraphInput {
  question: string
}

interface GraphRouteDecision {
  classification: QuestionClass
  intent: GraphRouteIntent
  routeKind: GraphRouteKind
  knowledgeDomains?: RagKnowledgeDomain[]
  sourceTypes?: RagRetrievalSourceType[]
  preferSourceTypes?: RagRetrievalSourceType[]
  documentIds?: string[]
  reason: string
  skipModelOnMiss: boolean
  catalogProbeHits: RagCatalogProbeHit[]
}

interface GraphRetrievalResult {
  knowledgeDomains: RagKnowledgeDomain[]
  sourceTypes: RagRetrievalSourceType[] | undefined
  preferSourceTypes: RagRetrievalSourceType[] | undefined
  vectorScope: 'draft' | 'published' | 'all'
  catalogProbeHits: RagCatalogProbeHit[]
  skipModelOnMiss: boolean
  fallbackReason: string | null
  ragResult: Awaited<ReturnType<RagService['ask']>>
  resume: StandardResume | null
  resumeSummary: string
}

function trimForLog(value: string | undefined): string | undefined {
  if (!value) return undefined
  const normalized = value.replace(/\s+/g, ' ').trim()
  return normalized.length > MAX_LOG_SNIPPET_LENGTH
    ? `${normalized.slice(0, MAX_LOG_SNIPPET_LENGTH)}...`
    : normalized
}

function summarizeCitationForLog(citation: RagAskCitation) {
  return {
    ref: citation.ref,
    title: citation.title,
    sourceType: citation.sourceType,
    score: citation.score,
    knowledgeDomain: citation.knowledgeDomain,
    contentType: citation.contentType,
    renderHint: citation.renderHint,
    hasRichCard: Boolean(citation.richCard),
    snippet: trimForLog(citation.snippet),
  }
}

function summarizeCatalogProbeHitForLog(hit: RagCatalogProbeHit) {
  return {
    documentId: hit.documentId,
    title: hit.title,
    score: hit.score,
    sourceType: hit.sourceType,
    sourceScope: hit.sourceScope,
    knowledgeDomain: hit.knowledgeDomain,
    contentType: hit.contentType,
    preview: trimForLog(hit.preview ?? undefined),
  }
}

function getBlockTitleForLog(block: AiChatMessageBlock): string | undefined {
  if (block.type === 'text') return undefined
  if (block.type === 'system_notice') return trimForLog(block.text)
  if (block.type === 'summary') return block.title
  return block.title
}

function summarizeAnswerBlocksForLog(blocks: AiChatMessageBlock[]) {
  return blocks.map((block) => ({
    type: block.type,
    title: getBlockTitleForLog(block),
  }))
}

function readLocalizedText(value: LocalizedText, locale: AiChatLocale): string {
  return (locale === 'en' ? value.en : value.zh || value.en || value.zh).trim()
}

function formatPeriod(startDate: string, endDate: string): string {
  return [startDate, endDate].filter(Boolean).join(' - ')
}

function classifyQuestion(question: string): QuestionClass {
  const trimmed = question.trim()
  const lower = trimmed.toLowerCase()
  const greetingPatterns = [
    'hello', 'hi', 'hey', 'yo', 'hola', 'good morning', 'good afternoon',
    '你好', '哈喽', '嗨', '在吗', '有人在吗', '早', '晚上好', '下午好',
    'who are you', 'what can you do', 'what can you',
    'test', 'testing', '测试', '测试一下', '试一下', '试下',
    'ping', 'pong', 'help', '123', '1234', '12345',
  ]

  if (trimmed.length <= 15 && greetingPatterns.some((pattern) => lower.includes(pattern))) {
    return 'greeting'
  }

  const negativePatterns = [
    '好烦', '不开心', '难过', '伤心', '郁闷', '无聊', '累了',
    'sad', 'upset', 'tired', 'boring', 'frustrated',
  ]

  if (trimmed.length <= 15 && negativePatterns.some((pattern) => lower.includes(pattern))) {
    return 'negative'
  }

  if (trimmed.length <= 4 && !/[?？]/.test(trimmed)) {
    return 'short'
  }

  return 'normal'
}

function buildResumeSummary(resume: StandardResume, locale: AiChatLocale): string {
  const l = (value: LocalizedText) => readLocalizedText(value, locale)
  const lines: string[] = []

  lines.push(`姓名：${l(resume.profile.fullName)}`)
  lines.push(`角色：${l(resume.profile.headline)}`)
  lines.push(`所在地：${l(resume.profile.location)}`)
  if (resume.profile.email) lines.push(`邮箱：${resume.profile.email}`)
  if (resume.profile.website) lines.push(`网站：${resume.profile.website}`)

  if (resume.experiences.length > 0) {
    lines.push('', '工作经历：')
    for (const exp of resume.experiences) {
      const period = [exp.startDate, exp.endDate || '至今'].filter(Boolean).join(' - ')
      lines.push(`  · ${l(exp.companyName)} | ${l(exp.role)} | ${period}`)
      const summary = l(exp.summary)
      if (summary) lines.push(`    ${summary}`)
      if (exp.technologies.length > 0) lines.push(`    技术栈：${exp.technologies.join('、')}`)
    }
  }

  if (resume.education.length > 0) {
    lines.push('', '教育背景：')
    for (const edu of resume.education) {
      const period = [edu.startDate, edu.endDate].filter(Boolean).join(' - ')
      lines.push(`  · ${l(edu.schoolName)} | ${l(edu.degree)} ${l(edu.fieldOfStudy)} | ${period}`)
    }
  }

  if (resume.projects.length > 0) {
    lines.push('', '项目经历：')
    for (const project of resume.projects.slice(0, 5)) {
      const period = [project.startDate, project.endDate || '至今'].filter(Boolean).join(' - ')
      lines.push(`  · ${l(project.name)} | ${l(project.role)} | ${period}`)
    }
  }

  if (resume.skills.length > 0) {
    lines.push('', '技能：')
    for (const skill of resume.skills) {
      if (skill.keywords.length > 0) {
        lines.push(`  · ${l(skill.name)}：${skill.keywords.map((keyword) => l(keyword)).join('、')}`)
      }
    }
  }

  if (resume.highlights.length > 0) {
    lines.push('', '核心竞争力/亮点：')
    for (const highlight of resume.highlights) {
      lines.push(`  · ${l(highlight.title)} — ${l(highlight.description)}`)
    }
  }

  return lines.join('\n')
}

function buildGreetingAnswer(locale: AiChatLocale): AiChatAnswerGenerationResult {
  return {
    answer:
      locale === 'en'
        ? "Hi there! I'm FYS (Fridolph), a full-stack engineer. This is my personal resume site — feel free to ask me about my projects, work experience, technical skills, or career journey. I'd love to share!"
        : '你好！我是 FYS（Fridolph），一位全栈工程师。这里是我的个人简历站，你可以问我关于项目经历、工作经历、技术技能或职业发展的问题，我很乐意分享！',
    blocks: [],
    citations: [],
  }
}

function buildShortAnswer(question: string, locale: AiChatLocale): AiChatAnswerGenerationResult {
  if (locale === 'en' && /what|how|why|when|where|who|can you|tell me|do you/i.test(question)) {
    return { answer: '', blocks: [], citations: [] }
  }

  if (/为什么|什么|怎么|如何|哪里|是谁|能不能|可以/.test(question)) {
    return { answer: '', blocks: [], citations: [] }
  }

  return {
    answer:
      locale === 'en'
        ? "Ask me anything about my resume — my projects, skills, or work experience. I'm happy to share!"
        : '可以问我任何简历相关的问题——项目经历、技能、工作经历都可以，我很乐意分享！',
    blocks: [],
    citations: [],
  }
}

function buildNegativeAnswer(locale: AiChatLocale): AiChatAnswerGenerationResult {
  return {
    answer:
      locale === 'en'
        ? "I hear you — we all have tough moments. Want to talk about something inspiring, like the projects I've worked on or the skills I've picked up along the way?"
        : '我理解，每个人都会有情绪低落的时候。要不要聊聊一些有意思的事情，比如我做过的项目或者学到的技能？',
    blocks: [],
    citations: [],
  }
}

function buildIrrelevantAnswer(locale: AiChatLocale): AiChatAnswerGenerationResult {
  return {
    answer:
      locale === 'en'
        ? "I can only answer questions about my background, projects, work experience, technical skills, and related interests. Feel free to ask about those!"
        : '我只能回答关于我的背景、项目经历、工作经历、技术技能和相关兴趣的问题。欢迎问我这些方面！',
    blocks: [],
    citations: [],
  }
}

function buildSupplementMissAnswer(locale: AiChatLocale): AiChatAnswerGenerationResult {
  return {
    answer:
      locale === 'en'
        ? "I can only answer from my resume and the extra materials already indexed in my knowledge base. I couldn't find enough indexed supplementary content for this topic yet."
        : '我目前只能回答简历主线和已经补充入库的资料内容。这个问题暂时没有命中足够的补充资料，所以我不想冒然乱答。',
    blocks: [],
    citations: [],
  }
}

function buildLowRelevanceAnswer(
  question: string,
  topScore: number,
  locale: AiChatLocale,
): AiChatAnswerGenerationResult {
  const isShort = question.trim().length <= 6

  if (topScore < 0.05) {
    if (isShort) return buildShortAnswer(question, locale)
    return buildIrrelevantAnswer(locale)
  }

  if (topScore < 0.1) {
    return {
      answer:
        locale === 'en'
          ? `Hmm, I'm not sure I caught that clearly. Try asking about something specific — like my projects, skills, or work experience!`
          : '嗯，这个问题我不太确定怎么回答。可以试试问我具体一些的事情——比如项目经历、技能或者工作经历？',
      blocks: [],
      citations: [],
    }
  }

  if (isShort) return buildShortAnswer(question, locale)
  return buildIrrelevantAnswer(locale)
}

const DISPLAY_TITLE_EXTENSION_REGEX = /\.(md|markdown|txt|pdf|docx?)$/i
const DISPLAY_TERM_STOP_WORDS = new Set([
  '介绍',
  '什么',
  '怎么',
  '如何',
  '还有',
  '最近',
  '一下',
  '说说',
  '聊聊',
  '关于',
  '一下子',
  '兴趣',
  '爱好',
  '特长',
  '水平',
  '相关',
  '资料',
  '内容',
  '喜欢',
  '平时',
  'hobby',
  'hobbies',
  'interest',
  'interests',
  'about',
  'resume',
])

function sanitizeDisplayTitle(value: string | undefined): string {
  return (value ?? '').trim().replace(DISPLAY_TITLE_EXTENSION_REGEX, '').trim()
}

function resolveCardSummary(citation: RagAskCitation): string {
  return citation.richCard?.summary?.trim() || citation.richCard?.description?.trim() || citation.snippet
}

function normalizeUserDocCardCategory(contentType: string | undefined): 'hobby' | 'tech_blog' | 'knowledge_column' | 'general' {
  if (contentType === 'hobby') return 'hobby'
  if (contentType === 'knowledge_column' || contentType === 'media') return 'knowledge_column'
  if (contentType === 'general') return 'general'

  return 'tech_blog'
}

function normalizeArticleCardCategory(contentType: string | undefined): 'tech_blog' | 'knowledge_column' | 'general' {
  const category = normalizeUserDocCardCategory(contentType)

  return category === 'hobby' ? 'tech_blog' : category
}

function buildRichCardMedia(citation: RagAskCitation) {
  const richCard = citation.richCard
  const existingMedia = richCard?.media ?? []
  const imageUrls = Array.isArray(richCard?.imageUrls) ? richCard.imageUrls : []
  const imageMedia = imageUrls
    .filter((url) => url && url !== richCard?.imageUrl)
    .map((url, index) => ({
      type: 'image' as const,
      url,
      thumbnailUrl: url,
      title: `参考图片 ${index + 2}`,
    }))

  return [...existingMedia, ...imageMedia]
}

function normalizeComparableText(value: string | undefined): string {
  return sanitizeDisplayTitle(value)
    .toLowerCase()
    .replace(/[《》〈〉「」『』【】（）()[\]{}]/g, ' ')
    .replace(/[`"'“”‘’]/g, ' ')
    .replace(/[，。！？、:：;；/\\|_.-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractInformativeTerms(value: string | undefined): string[] {
  if (!value) return []

  const normalized = normalizeComparableText(value)
  if (!normalized) return []

  const tokens =
    normalized.match(/[\p{Script=Han}]{2,}|[a-z0-9][a-z0-9+#.-]{1,}/gu) ?? []

  return Array.from(
    new Set(
      tokens.filter((token) => {
        if (!token) return false
        if (DISPLAY_TERM_STOP_WORDS.has(token)) return false
        if (/^[0-9]+$/.test(token)) return false
        return token.length >= 2
      }),
    ),
  )
}

function countOverlap(source: readonly string[], target: readonly string[]): number {
  if (source.length === 0 || target.length === 0) return 0
  const targetSet = new Set(target)
  return source.reduce((count, term) => count + (targetSet.has(term) ? 1 : 0), 0)
}

function buildCitationDisplayTerms(
  citation: RagAskCitation,
  options: { includeSnippet?: boolean } = {},
): string[] {
  const values = [
    citation.title,
    citation.richCard?.title,
    ...(citation.tags ?? []),
    ...(citation.richCard?.keywords ?? []),
  ]

  if (options.includeSnippet !== false) {
    values.push(citation.snippet)
    values.push(citation.richCard?.description)
  }

  return Array.from(new Set(values.flatMap((value) => extractInformativeTerms(value))))
}

function selectPrimaryHobbyCitation(
  focusText: string,
  citations: readonly RagAskCitation[],
): RagAskCitation | null {
  if (citations.length === 0) return null

  const focusTerms = extractInformativeTerms(focusText)
  if (focusTerms.length === 0) return citations[0] ?? null

  return citations.reduce<{ citation: RagAskCitation; score: number } | null>((best, citation) => {
    const titleTerms = buildCitationDisplayTerms(citation, { includeSnippet: false })
    const displayTerms = buildCitationDisplayTerms(citation)
    const score =
      countOverlap(titleTerms, focusTerms) * 5
      + countOverlap(displayTerms, focusTerms) * 2
      + (citation.score ?? 0)

    if (!best || score > best.score) {
      return { citation, score }
    }

    return best
  }, null)?.citation ?? null
}

function buildCitationFocusTerms(
  question: string,
  answerText?: string,
): {
  questionTerms: string[]
  answerTerms: string[]
  focusText: string
} {
  const questionTerms = extractInformativeTerms(question)
  const answerTerms = extractInformativeTerms(answerText)
  const focusText =
    questionTerms.length > 0 || answerTerms.length === 0
      ? question
      : `${question}\n${answerText ?? ''}`

  return {
    questionTerms,
    answerTerms,
    focusText,
  }
}

function isBroadHobbyOverviewQuestion(question: string): boolean {
  const normalized = normalizeComparableText(question)

  const topicSignals = ['兴趣爱好', '兴趣', '爱好', '特长', '业余']
  const broadSignals = ['哪些', '什么', '还有', '都有', '聊聊', '说说', '介绍']

  return (
    topicSignals.some((signal) => normalized.includes(signal))
    && broadSignals.some((signal) => normalized.includes(signal))
  )
}

function filterDisplayRelevantCitations(
  question: string,
  citations: readonly RagAskCitation[],
  answerText?: string,
): RagAskCitation[] {
  const hobbyCitations = citations.filter(
    (citation) => citation.sourceType === 'user_docs' && citation.contentType === 'hobby',
  )

  if (hobbyCitations.length <= 1) {
    return [...citations]
  }

  const { questionTerms, answerTerms, focusText } = buildCitationFocusTerms(question, answerText)
  const primaryHobbyCitation = selectPrimaryHobbyCitation(focusText, hobbyCitations)
  if (!primaryHobbyCitation) {
    return [...citations]
  }

  if ((isBroadHobbyOverviewQuestion(question) || questionTerms.length === 0) && answerTerms.length > 0) {
    const normalizedAnswerText = normalizeComparableText(answerText).replace(/\s+/g, '')
    const answerAnchoredCitations = citations.filter((citation) => {
      if (citation.sourceType !== 'user_docs' || citation.contentType !== 'hobby') {
        return true
      }

      if (citation.id === primaryHobbyCitation.id) {
        return true
      }

      const citationTerms = buildCitationDisplayTerms(citation)
      const comparableTitle = normalizeComparableText(
        citation.richCard?.title ?? citation.title,
      ).replace(/\s+/g, '')

      return (
        countOverlap(citationTerms, answerTerms) > 0
        || (Boolean(comparableTitle) && normalizedAnswerText.includes(comparableTitle))
      )
    })

    const matchedHobbyCount = answerAnchoredCitations.filter(
      (citation) => citation.sourceType === 'user_docs' && citation.contentType === 'hobby',
    ).length

    if (matchedHobbyCount > 0) {
      return answerAnchoredCitations
    }
  }

  const anchorTerms = Array.from(
    new Set([
      ...questionTerms,
      ...buildCitationDisplayTerms(
        primaryHobbyCitation,
        questionTerms.length > 0 ? { includeSnippet: false } : undefined,
      ),
    ]),
  )
  const primaryTitle = normalizeComparableText(
    primaryHobbyCitation.richCard?.title ?? primaryHobbyCitation.title,
  )

  return citations.filter((citation) => {
    if (citation.sourceType !== 'user_docs' || citation.contentType !== 'hobby') {
      return true
    }

    if (citation.id === primaryHobbyCitation.id) {
      return true
    }

    const comparableTitle = normalizeComparableText(citation.richCard?.title ?? citation.title)
    if (primaryTitle && comparableTitle === primaryTitle) {
      return true
    }

    const citationTerms = buildCitationDisplayTerms(citation)
    return countOverlap(citationTerms, anchorTerms) > 0
  })
}

function resolveKnowledgeDomains(question: string): RagKnowledgeDomain[] | undefined {
  const lower = question.toLowerCase()
  const domains = new Set<RagKnowledgeDomain>()

  if (/项目|作品|案例|project|case|portfolio|agent|rag|ai|实战|落地|主导/.test(lower)) domains.add('projects')
  if (/工作|经历|公司|团队|管理|经验|负责过|参与|experience|company|team|lead/.test(lower)) domains.add('experience')
  if (/技能|技术栈|会什么|擅长|优势|亮点|掌握|熟悉|skill|tech|stack|strength/.test(lower)) domains.add('skills')
  if (/兴趣|爱好|特长|音乐|羽毛球|休闲|娱乐|喜欢|玩|hobby|music|badminton/.test(lower)) domains.add('hobbies')
  if (/文章|博客|创作|写作|学习|职业规划|规划|媒体|周易|dao|blog|article|writing|media|career/.test(lower)) domains.add('writing_media')

  return domains.size > 0 ? [...domains] : undefined
}

function mergeKnowledgeDomains(
  base: readonly RagKnowledgeDomain[] | undefined,
  extra: readonly RagKnowledgeDomain[] | undefined,
): RagKnowledgeDomain[] | undefined {
  const domains = [...(base ?? []), ...(extra ?? [])]
  return domains.length > 0 ? Array.from(new Set<RagKnowledgeDomain>(domains)) : undefined
}

function buildCatalogDomainHints(
  hits: readonly RagCatalogProbeHit[],
): RagKnowledgeDomain[] | undefined {
  const domains = hits
    .map((item) => item.knowledgeDomain)
    .filter((item): item is RagKnowledgeDomain => Boolean(item))

  return domains.length > 0 ? Array.from(new Set(domains)) : undefined
}

function selectPrimaryCatalogProbeHit(
  hits: readonly RagCatalogProbeHit[],
): RagCatalogProbeHit | null {
  if (hits.length === 0) {
    return null
  }

  return [...hits].sort((left, right) => right.score - left.score)[0] ?? null
}

function hasResumeSignals(question: string): boolean {
  return /简历|背景|自我介绍|介绍一下|工作|经历|公司|团队|管理|经验|教育|学校|学历|技能|技术栈|优势|亮点|求职|角色|职位|负责|做过|resume|background|experience|company|education|skill/.test(
    question.toLowerCase(),
  )
}

function hasSupplementSignals(question: string): boolean {
  return /博客|文章|写作|创作|兴趣|爱好|特长|擅长|专长|职业规划|作品集|媒体|播客|周易|dao|blog|article|writing|hobby|interest|media/.test(
    question.toLowerCase(),
  )
}

/**
 * 检测「工作外」语境——用户明确想了解 resume 之外的内容。
 * 匹配：工作外/工作之外/工作以外/工作之余/业余/闲暇/主业外
 */
function hasWorkOutsideNegation(question: string): boolean {
  return /工作外|工作之外|工作以外|工作之余|业余|闲暇|主业外|平时|平常/.test(
    question.toLowerCase(),
  )
}

function hasHybridSignals(question: string): boolean {
  return /项目.*(文章|博客|写作|资料)|文章.*项目|博客.*项目|作品.*经历|经历.*作品|project.*article|article.*project/.test(
    question.toLowerCase(),
  )
}

function isClearlyOutOfScopeQuestion(question: string): boolean {
  const lower = question.toLowerCase()
  const resumeRelated = /我|你|简历|项目|经历|工作|公司|技能|技术|特长|兴趣|爱好|文章|博客|学习|职业|规划|作品|dao|resume|project|experience|skill|hobby|career|work|blog|article/.test(lower)

  if (resumeRelated) return false

  return /天气|股价|股票|彩票|算命|星座|新闻|政治|法律咨询|医疗诊断|菜谱|写作业|代写|weather|stock|lottery|politic|medical|legal|recipe|homework/.test(lower)
}

@Injectable()
export class AiChatGraphService {
  private readonly logger = new Logger(AiChatGraphService.name)

  constructor(
    @Inject(AiService)
    private readonly aiService: AiService,
    @Inject(RagService)
    private readonly ragService: RagService,
    @Inject(ResumePublicationService)
    private readonly resumePublicationService: ResumePublicationService,
  ) {}

  async generateAnswer(input: AiChatGraphInput): Promise<AiChatAnswerGenerationResult> {
    const startedAt = Date.now()
    const normalized = this.normalizeInput(input)
    let route: GraphRouteDecision | null = null

    try {
      route = await this.routeIntentAndDomain(normalized)
      const guarded = this.boundaryGuard(normalized, route)

      if (guarded) {
        this.logNode('boundary_guard', normalized, route, startedAt)
        return guarded
      }

      const directAnswer = this.resolveDirectAnswer(normalized, route)
      if (directAnswer) {
        this.logNode('answer_compose', normalized, route, startedAt)
        return directAnswer
      }

      const retrieval = await this.retrieve(normalized, route)
      const answer = await this.composeAnswer(normalized, route, retrieval)
      this.logNode('answer_compose', normalized, route, startedAt, {
        citationCount: answer.citations.length,
        blockCount: answer.blocks.length,
        blockTypes: summarizeAnswerBlocksForLog(answer.blocks),
        retrievalKnowledgeDomains: retrieval.knowledgeDomains,
      })

      return answer
    } catch (error) {
      this.logger.warn({
        event: 'ai-chat.graph.fallback_triggered',
        question: normalized.question,
        message: error instanceof Error ? error.message : String(error),
        durationMs: Date.now() - startedAt,
      })

      return this.generateFallbackAnswer(normalized, route)
    }
  }

  private normalizeInput(input: AiChatGraphInput): NormalizedGraphInput {
    return {
      ...input,
      question: input.question.trim(),
    }
  }

  private async routeIntentAndDomain(input: NormalizedGraphInput): Promise<GraphRouteDecision> {
    const classification = classifyQuestion(input.question)

    if (classification !== 'normal') {
      return {
        classification,
        intent: 'direct',
        routeKind: 'direct',
        reason: `rule:${classification}`,
        skipModelOnMiss: false,
        catalogProbeHits: [],
      }
    }

    if (isClearlyOutOfScopeQuestion(input.question)) {
      return {
        classification,
        intent: 'blocked',
        routeKind: 'reject',
        reason: 'rule:out_of_scope',
        skipModelOnMiss: true,
        catalogProbeHits: [],
      }
    }

    const catalogProbeHits = await this.ragService.probeSupplementCatalog(
      input.question,
      5,
      {
        sourceTypes: ['user_docs'],
        preferSourceTypes: ['user_docs'],
      },
    )
    const explicitDomains = resolveKnowledgeDomains(input.question)
    const catalogDomains = buildCatalogDomainHints(catalogProbeHits)
    const primaryCatalogHit = selectPrimaryCatalogProbeHit(catalogProbeHits)
    const mergedDomains = mergeKnowledgeDomains(explicitDomains, catalogDomains)
    const workOutsideNegation = hasWorkOutsideNegation(input.question)
    // 工作外语境下抑制简历匹配，避免「工作外特长」被误路由到 resume_only
    const resumeSignals = hasResumeSignals(input.question) && !workOutsideNegation
    const supplementSignals =
      hasSupplementSignals(input.question) || catalogProbeHits.length > 0 || workOutsideNegation
    const hybridSignals = hasHybridSignals(input.question) || (resumeSignals && supplementSignals)

    if (hybridSignals) {
      return {
        classification,
        intent: 'rag',
        routeKind: 'hybrid',
        knowledgeDomains: mergedDomains,
        sourceTypes: ['resume_core', 'user_docs'],
        preferSourceTypes: ['user_docs', 'resume_core'],
        documentIds:
          primaryCatalogHit && primaryCatalogHit.score >= 1
            ? [primaryCatalogHit.documentId]
            : undefined,
        reason: catalogProbeHits.length > 0 ? 'rag:hybrid_with_catalog_probe' : 'rag:hybrid_rule',
        skipModelOnMiss: true,
        catalogProbeHits,
      }
    }

    if (supplementSignals) {
      return {
        classification,
        intent: 'rag',
        routeKind: 'supplement_only',
        knowledgeDomains: mergedDomains,
        sourceTypes: ['user_docs', 'knowledge'],
        preferSourceTypes: ['user_docs', 'knowledge'],
        documentIds:
          primaryCatalogHit && primaryCatalogHit.score >= 1
            ? [primaryCatalogHit.documentId]
            : undefined,
        reason: catalogProbeHits.length > 0 ? 'rag:supplement_catalog_probe' : 'rag:supplement_rule',
        skipModelOnMiss: true,
        catalogProbeHits,
      }
    }

    return {
      classification,
      intent: 'rag',
      routeKind: 'resume_only',
      knowledgeDomains: explicitDomains,
      sourceTypes: ['resume_core'],
      preferSourceTypes: ['resume_core'],
      reason: 'rag:resume_route',
      skipModelOnMiss: false,
      catalogProbeHits,
    }
  }

  private boundaryGuard(
    input: NormalizedGraphInput,
    route: GraphRouteDecision,
  ): AiChatAnswerGenerationResult | null {
    if (route.intent === 'blocked' || route.routeKind === 'reject') {
      return buildIrrelevantAnswer(input.locale)
    }

    return null
  }

  private resolveDirectAnswer(
    input: NormalizedGraphInput,
    route: GraphRouteDecision,
  ): AiChatAnswerGenerationResult | null {
    if (route.classification === 'greeting') return buildGreetingAnswer(input.locale)
    if (route.classification === 'negative') return buildNegativeAnswer(input.locale)

    if (route.classification === 'short') {
      const answer = buildShortAnswer(input.question, input.locale)
      if (answer.answer) return answer
    }

    return null
  }

  private async retrieve(
    input: NormalizedGraphInput,
    route: GraphRouteDecision,
  ): Promise<GraphRetrievalResult> {
    const startedAt = Date.now()
    const snapshot = await this.resumePublicationService.getPublished()
    const resume = snapshot?.resume ?? null
    const resumeSummary = resume ? buildResumeSummary(resume, input.locale) : ''
    const vectorScope = ((process.env.RAG_SEARCH_VECTOR_SCOPE?.trim().toLowerCase() ?? 'published') as 'draft' | 'published' | 'all')
    const knowledgeDomains = route.knowledgeDomains ?? []
    const ragResult = await this.ragService.ask(
      input.question,
      DEFAULT_CHAT_LIMIT,
      input.locale,
      {
        knowledgeDomains,
        sourceTypes: route.sourceTypes,
        preferSourceTypes: route.preferSourceTypes,
        documentIds: route.documentIds,
      },
      {
        minAcceptedCitationScore: 0.1,
        onToken: input.onToken,
      },
    )
    const hasSupplementCitation = ragResult.citations.some((item) => item.sourceType === 'user_docs')
    const topCitationScore = ragResult.citations[0]?.score ?? 0
    const fallbackReason = route.routeKind === 'resume_only'
      ? (ragResult.citations.length === 0
        ? (resumeSummary ? 'no_citation_use_resume_summary' : 'no_citation_no_resume_summary')
        : null)
      : (!hasSupplementCitation
        ? 'supplement_miss_skip_model'
        : topCitationScore < 0.1
          ? 'supplement_low_relevance_skip_model'
          : null)

    this.logger.log({
      event: 'ai-chat.graph.retrieval_completed',
      classification: route.classification,
      intent: route.intent,
      routeKind: route.routeKind,
      reason: route.reason,
      question: input.question,
      knowledgeDomains,
      sourceTypes: route.sourceTypes,
      preferSourceTypes: route.preferSourceTypes,
      documentIds: route.documentIds,
      vectorScope,
      catalogProbeHits: route.catalogProbeHits.map(summarizeCatalogProbeHitForLog),
      skipModelOnMiss: route.skipModelOnMiss,
      matchCount: ragResult.matches.length,
      citationCount: ragResult.citations.length,
      topMatches: ragResult.matches.slice(0, 3).map((item) => ({
        id: item.id,
        title: item.title,
        sourceType: item.sourceType,
        score: item.score,
        knowledgeDomain: item.knowledgeDomain,
      })),
      topCitations: ragResult.citations.slice(0, 3).map(summarizeCitationForLog),
      fallbackReason,
      durationMs: Date.now() - startedAt,
    })

    return {
      knowledgeDomains,
      sourceTypes: route.sourceTypes,
      preferSourceTypes: route.preferSourceTypes,
      vectorScope,
      catalogProbeHits: route.catalogProbeHits,
      skipModelOnMiss: route.skipModelOnMiss,
      fallbackReason,
      ragResult,
      resume,
      resumeSummary,
    }
  }

  private async composeAnswer(
    input: NormalizedGraphInput,
    route: GraphRouteDecision,
    retrieval: GraphRetrievalResult,
  ): Promise<AiChatAnswerGenerationResult> {
    const displayCitations = filterDisplayRelevantCitations(
      input.question,
      retrieval.ragResult.citations,
      retrieval.ragResult.answer,
    )
    const hasSupplementCitation = displayCitations.some(
      (item) => item.sourceType === 'user_docs',
    )

    if (route.skipModelOnMiss && !hasSupplementCitation) {
      return buildSupplementMissAnswer(input.locale)
    }

    if (retrieval.ragResult.citations.length === 0 && !retrieval.resumeSummary) {
      const topScore = retrieval.ragResult.matches[0]?.score ?? 0
      if (route.skipModelOnMiss) {
        return buildSupplementMissAnswer(input.locale)
      }
      return buildLowRelevanceAnswer(input.question, topScore, input.locale)
    }

    const topCitationScore = retrieval.ragResult.citations[0]?.score
    if (typeof topCitationScore === 'number' && topCitationScore < 0.1) {
      if (route.skipModelOnMiss) {
        return buildSupplementMissAnswer(input.locale)
      }
      return buildLowRelevanceAnswer(input.question, topCitationScore, input.locale)
    }

    const resumeBlocks = retrieval.resume
      ? this.buildAnswerBlocksFromResume(retrieval.resume, displayCitations, input.locale)
      : []
    const customBlocks = this.buildCustomBlocksFromCitations(
      input.question,
      displayCitations,
      retrieval.ragResult.answer,
    )
    const cardBlocks = [...resumeBlocks, ...customBlocks].slice(0, 4)

    if (retrieval.ragResult.answer && displayCitations.length > 0) {
      return {
        answer: retrieval.ragResult.answer,
        citations: displayCitations,
        blocks: cardBlocks,
      }
    }

    if (route.routeKind !== 'resume_only') {
      return buildSupplementMissAnswer(input.locale)
    }

    return this.generateResumeFallbackAnswer(input, retrieval.resumeSummary, cardBlocks, route)
  }

  private async generateFallbackAnswer(
    input: NormalizedGraphInput,
    route: GraphRouteDecision | null,
  ): Promise<AiChatAnswerGenerationResult> {
    if (route && route.routeKind !== 'resume_only') {
      return buildSupplementMissAnswer(input.locale)
    }

    const snapshot = await this.resumePublicationService.getPublished()
    const resumeSummary = snapshot?.resume ? buildResumeSummary(snapshot.resume, input.locale) : ''

    if (!resumeSummary) {
      return buildIrrelevantAnswer(input.locale)
    }

    return this.generateResumeFallbackAnswer(input, resumeSummary, [], {
      classification: 'normal',
      intent: 'rag',
      routeKind: 'resume_only',
      reason: 'fallback:graph_error',
      sourceTypes: ['resume_core'],
      preferSourceTypes: ['resume_core'],
      skipModelOnMiss: false,
      catalogProbeHits: [],
    })
  }

  private async generateResumeFallbackAnswer(
    input: NormalizedGraphInput,
    resumeSummary: string,
    blocks: AiChatMessageBlock[],
    route: GraphRouteDecision,
  ): Promise<AiChatAnswerGenerationResult> {
    const systemPrompt = buildRagAskSystemPrompt(input.locale)
    const prompt = input.locale === 'en'
      ? [`Question: ${input.question}`, 'Resume summary:', resumeSummary, 'Answer based on the resume summary above. Keep it concise and natural.'].join('\n\n')
      : [`问题：${input.question}`, '简历摘要：', resumeSummary, '请根据以上简历摘要，用自然的第一人称回答。简洁真诚，不确定的地方可以诚实说明。'].join('\n\n')
    const result = input.onToken
      ? await this.aiService.generateTextStream({ systemPrompt, prompt, onToken: input.onToken })
      : await this.aiService.generateText({ systemPrompt, prompt })

    this.logger.log({
      event: 'ai-chat.graph.resume_fallback',
      routeKind: route.routeKind,
      reason: route.reason,
      knowledgeDomains: route.knowledgeDomains,
      sourceTypes: route.sourceTypes,
      preferSourceTypes: route.preferSourceTypes,
      skipModelOnMiss: route.skipModelOnMiss,
      question: input.question,
      blockCount: blocks.length,
      blockTypes: summarizeAnswerBlocksForLog(blocks),
    })

    return {
      answer: result.text,
      citations: [],
      blocks,
    }
  }

  private buildAnswerBlocksFromResume(
    resume: StandardResume,
    citations: RagAskCitation[],
    locale: AiChatLocale,
  ): AiChatMessageBlock[] {
    const projectBlocks = new Map<string, AiChatProjectCardBlock>()
    const experienceBlocks = new Map<string, AiChatExperienceCardBlock>()

    for (const citation of citations) {
      if (citation.section === 'project') {
        const project = this.findProjectByCitation(resume.projects, citation, locale)
        if (project && !projectBlocks.has(citation.title)) {
          projectBlocks.set(citation.title, {
            type: 'project_card',
            title: readLocalizedText(project.name, locale),
            subtitle: readLocalizedText(project.role, locale),
            period: formatPeriod(project.startDate, project.endDate),
            summary: readLocalizedText(project.summary, locale),
            technologies: project.technologies,
            highlights: project.highlights.map((item) => readLocalizedText(item, locale)).filter(Boolean).slice(0, 3),
          })
        }
      }

      if (citation.section === 'experience') {
        const experience = this.findExperienceByCitation(resume.experiences, citation, locale)
        if (experience && !experienceBlocks.has(citation.title)) {
          experienceBlocks.set(citation.title, {
            type: 'experience_card',
            title: readLocalizedText(experience.companyName, locale),
            subtitle: readLocalizedText(experience.role, locale),
            period: formatPeriod(experience.startDate, experience.endDate),
            summary: readLocalizedText(experience.summary, locale),
            technologies: experience.technologies,
            highlights: experience.highlights.map((item) => readLocalizedText(item, locale)).filter(Boolean).slice(0, 3),
          })
        }
      }
    }

    return [...projectBlocks.values(), ...experienceBlocks.values()].slice(0, 2)
  }

  private buildCustomBlocksFromCitations(
    question: string,
    citations: RagAskCitation[],
    answerText?: string,
  ): AiChatMessageBlock[] {
    const blocks: AiChatMessageBlock[] = []
    const seen = new Set<string>()
    const hobbyCitations = citations.filter(
      (citation) => citation.sourceType === 'user_docs' && citation.contentType === 'hobby',
    )
    const { focusText } = buildCitationFocusTerms(question, answerText)
    const primaryHobbyCitation = selectPrimaryHobbyCitation(focusText, hobbyCitations)

    for (const citation of citations) {
      if (citation.sourceType !== 'user_docs') continue
      const contentType = citation.contentType
      if (!contentType || seen.has(`${contentType}:${citation.title}`)) continue
      seen.add(`${contentType}:${citation.title}`)

      if (contentType === 'article' || contentType === 'tech_blog' || contentType === 'knowledge_column' || contentType === 'general' || contentType === 'media') {
        const richCard = citation.richCard
        blocks.push({
          type: 'article_card',
          title: richCard?.title ?? sanitizeDisplayTitle(citation.title),
          summary: resolveCardSummary(citation),
          category: normalizeArticleCardCategory(contentType),
          url: richCard?.url,
          imageUrl: richCard?.imageUrl,
          publishedAt: richCard?.publishedAt,
          keywords: richCard?.keywords ?? citation.tags ?? [],
          media: buildRichCardMedia(citation),
        })
      } else if (contentType === 'hobby') {
        if (!primaryHobbyCitation || citation.id !== primaryHobbyCitation.id) continue
        const richCard = citation.richCard

        blocks.push({
          type: 'hobby_card',
          title: richCard?.title ?? sanitizeDisplayTitle(citation.title),
          description: resolveCardSummary(citation),
          category: 'hobby',
          url: richCard?.url,
          imageUrl: richCard?.imageUrl,
          keywords: richCard?.keywords ?? citation.tags ?? [],
          media: buildRichCardMedia(citation),
        })
      } else if (contentType === 'project') {
        const richCard = citation.richCard

        blocks.push({
          type: 'project_card',
          title: richCard?.title ?? sanitizeDisplayTitle(citation.title),
          subtitle: '补充项目资料',
          period: '',
          summary: resolveCardSummary(citation),
          technologies: richCard?.keywords ?? citation.tags ?? [],
          highlights: [],
          url: richCard?.url,
          imageUrl: richCard?.imageUrl,
        })
      }
    }

    return blocks.slice(0, 3)
  }

  private findProjectByCitation(
    projects: ResumeProjectItem[],
    citation: RagAskCitation,
    locale: AiChatLocale,
  ) {
    return projects.find((project) => {
      const title = readLocalizedText(project.name, locale)
      return title === citation.title || citation.title.includes(title) || title.includes(citation.title)
    })
  }

  private findExperienceByCitation(
    experiences: ResumeExperienceItem[],
    citation: RagAskCitation,
    locale: AiChatLocale,
  ) {
    return experiences.find((experience) => {
      const title = readLocalizedText(experience.companyName, locale)
      return title === citation.title || citation.title.includes(title) || title.includes(citation.title)
    })
  }

  private logNode(
    node: string,
    input: NormalizedGraphInput,
    route: GraphRouteDecision,
    startedAt: number,
    extra: Record<string, unknown> = {},
  ) {
    this.logger.log({
      event: 'ai-chat.graph.node_completed',
      node,
      classification: route.classification,
      intent: route.intent,
      routeKind: route.routeKind,
      knowledgeDomains: route.knowledgeDomains,
      sourceTypes: route.sourceTypes,
      preferSourceTypes: route.preferSourceTypes,
      documentIds: route.documentIds,
      reason: route.reason,
      skipModelOnMiss: route.skipModelOnMiss,
      catalogProbeHits: route.catalogProbeHits.map(summarizeCatalogProbeHitForLog),
      question: input.question,
      durationMs: Date.now() - startedAt,
      ...extra,
    })
  }
}
