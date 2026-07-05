/**
 * AI Chat 图编排服务 — LangGraph + 旧引擎双模。
 *
 * ## 架构概览
 *
 * 本服务是 AI Chat 的"对话大脑"，负责将用户问题转化为回答。
 * 两套引擎并行，通过环境变量 AI_CHAT_USE_LANGGRAPH 切换：
 *
 * ```
 * generateAnswer(input)
 *   ├─ AI_CHAT_USE_LANGGRAPH=true  → generateAnswerWithLangGraph()
 *   │    └─ StateGraph.invoke()    → 8 节点 + 5 条件边 + 1 回边
 *   │                                （LLM 语义路由 + 多跳 + 评估）
 *   └─ AI_CHAT_USE_LANGGRAPH=false → generateAnswerLegacy()
 *        └─ routeIntentAndDomain() → 正则路由 + 单次检索 + 卡片组装
 *                                     （旧引擎，保持稳定回退）
 * ```
 *
 * ## LangGraph 图结构（新引擎）
 *
 * ```
 * START → route_intent ─┬→ direct_answer → END
 *                        └→ decompose ─┬→ retrieve ─┬→ plan_next
 *                                      │              ├→ retrieve (🔄)
 *                                      │              └→ evaluate
 *                                      │                   ├→ rag_generate → END
 *                                      │                   └→ fallback_answer → END
 *                                      └→ decompose_question → retrieve
 * ```
 *
 * ## 旧引擎流程
 *
 * ```
 * classifyQuestion → boundaryGuard → resolveDirectAnswer
 *   → routeIntentAndDomain → retrieve → composeAnswer → END
 * ```
 *
 * 两者输出统一为 `AiChatAnswerGenerationResult { answer, blocks, citations }`。
 * 新引擎异常时自动回退旧引擎（兜底安全）。
 */

import { Inject, Injectable, Logger, Optional } from '@nestjs/common'
import { END, START, StateGraph } from '@langchain/langgraph'

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
import { AiChatGraphState } from './ai-chat-graph.state'
import { isLangGraphChatEnabled } from './ai-chat-graph.constants'
import { afterRoute } from './edges/after-route.edge'
import { afterPlan } from './edges/after-plan.edge'
import { afterDecompose } from './edges/after-decompose.edge'
import { afterEvaluate } from './edges/after-evaluate.edge'
import { createDecomposeNode } from './nodes/decompose.node'
import { createDecomposeQuestionNode } from './nodes/decompose-question.node'
import { createDirectAnswerNode } from './nodes/direct-answer.node'
import { createEvaluateNode } from './nodes/evaluate.node'
import { createFallbackAnswerNode } from './nodes/fallback-answer.node'
import { createPlanNextNode } from './nodes/plan-next.node'
import { createRagGenerateNode } from './nodes/rag-generate.node'
import { createRetrieveNode } from './nodes/retrieve.node'
import { createRouteIntentNode } from './nodes/route-intent.node'
import { GraphSearchService } from '../graph/graph-search.service'
import type {
  AiChatAnswerGenerationResult,
  AiChatExperienceCardBlock,
  AiChatLocale,
  AiChatMessageBlock,
  AiChatProjectCardBlock,
} from './ai-chat.types'

const DEFAULT_CHAT_LIMIT = 15
const MAX_LOG_SNIPPET_LENGTH = 120

/**
 * 问题分类结果。
 *
 * greeting：打招呼/测试 → 直接预置回复
 * short：   过短且非疑问 → 引导提示
 * negative：情绪低落 → 安抚式回复
 * normal：  正常问题 → 进入检索管线
 */
type QuestionClass = 'greeting' | 'short' | 'negative' | 'normal'
/** LangGraph 节点返回的路由意图 */
type GraphRouteIntent = 'direct' | 'rag' | 'blocked'
/** 路由分支类型：直接回复 / 仅简历 / 仅补充资料 / 混合 / 拒绝 */
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

/**
 * 旧引擎用 — 正则分类用户问题。
 *
 * 仅在旧引擎中作为 route_intent 的前置分类器使用。
 * 新引擎（LangGraph）由 route_intent 节点用 LLM withStructuredOutput 替代。
 *
 * 分类优先级：greeting > negative > short > normal。
 * greeting/negative 限制 ≤15 字防止误判，short 限制 ≤4 字且非疑问句。
 */
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

/**
 * 展示级 citation 过滤 — 控制前端渲染哪些卡片。
 *
 * 当前规则：hobby citation 超过 1 条时，只保留 score 最高的 3 条。
 * 非 hobby 的 citation 不受影响。
 *
 * 设计意图：避免"你有什么特长"这类宽泛问题时，页面上刷出一排兴趣卡片。
 */
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

  // 保留最多 3 条 hobby citation（按 score 降序），其余非 hobby citation 全部保留
  const topHobbyCitations = [...hobbyCitations]
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 3)
  const topHobbyIds = new Set(topHobbyCitations.map((c) => c.id))

  return citations.filter((citation) => {
    if (citation.sourceType !== 'user_docs' || citation.contentType !== 'hobby') {
      return true
    }
    return topHobbyIds.has(citation.id)
  })
}

/**
 * 旧引擎用 — 从问题文本匹配知识域。
 *
 * 正则关键词映射到 6 个 RagKnowledgeDomain：
 * projects | experience | skills | hobbies | writing_media | resume_core(隐式)
 *
 * 未命中任何域时返回 undefined（不限域，全量检索）。
 * 新引擎中此逻辑由 route_intent 节点的 LLM 替代。
 */
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

// ──── 路由信号函数（旧引擎 routeIntentAndDomain 使用） ────

/**
 * 检测问题是否涉及简历核心内容。
 * 匹配：工作/项目/技能/教育/角色/公司等关键词。
 */
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

/**
 * AiChatGraphService — AI Chat 双引擎对话编排。
 *
 * ## 依赖注入
 *
 * - AiService：LLM 文本生成 + 流式输出
 * - RagService：RAG 检索 + 问答（search/ask/probeSupplementCatalog）
 * - ResumePublicationService：读取已发布简历（buildAnswerBlocksFromResume 用）
 *
 * ## 生命周期
 *
 * compiledGraph 惰性初始化：首次调用 generateAnswer() 时才编译 LangGraph 图，
 * 之后复用同一实例（单例模式，NestJS 默认 scope）。
 */
@Injectable()
export class AiChatGraphService {
  private readonly logger = new Logger(AiChatGraphService.name)
  private compiledGraph: ReturnType<typeof this.compileLangGraph> | null = null

  constructor(
    @Inject(AiService)
    private readonly aiService: AiService,
    @Inject(RagService)
    private readonly ragService: RagService,
    @Inject(ResumePublicationService)
    private readonly resumePublicationService: ResumePublicationService,
    @Optional()
    @Inject(GraphSearchService)
    private readonly graphSearchService?: GraphSearchService,
  ) {}

  /**
   * 编译 LangGraph StateGraph（惰性初始化，首次调用 generateAnswer 时触发）。
   *
   * ## 节点职责
   *
   * | 节点 | 文件 | 类型 | 说明 |
   * |------|------|------|------|
   * | route_intent | route-intent.node.ts | LLM 结构化输出 | 6 策略语义路由 |
   * | direct_answer | direct-answer.node.ts | 纯预置话术 | 问候/引导/越界 |
   * | decompose | decompose.node.ts | 纯规则 | 判断是否需要拆子问题 |
   * | decompose_question | decompose-question.node.ts | LLM 结构化输出 | 拆为有序子问题列表 |
   * | retrieve | retrieve.node.ts | 业务逻辑 | 调用 RagService.ask()，支持游标 |
   * | plan_next | plan-next.node.ts | LLM + 硬兜底 | 循环控制中枢 |
   * | evaluate | evaluate.node.ts | LLM 结构化输出 | 检索充分性评估 |
   * | rag_generate | rag-generate.node.ts | 透传 | 当前为空操作（answer 已在 retrieve 中生成） |
   * | fallback_answer | fallback-answer.node.ts | 纯预置话术 | 信息不足兜底 |
   *
   * ## 边设计
   *
   * - afterRoute：strategy → direct_answer | decompose
   * - afterDecompose：decompositionNeeded → retrieve | decompose_question
   * - afterPlan：plannedNext → retrieve(🔄) | evaluate
   * - afterEvaluate：evaluation.enough → rag_generate | fallback_answer
   *
   * ## 🔄 回边机制
   *
   * retrieve → plan_next → retrieve 形成循环。
   * 每次 retrieve 推进游标 nextSubIdx，plan_next 用 remaining 和 retrievalCount 双重保险终止。
   */
  private compileLangGraph() {
    const routeIntentNode = createRouteIntentNode()
    const directAnswerNode = createDirectAnswerNode(this.aiService)
    const decomposeNode = createDecomposeNode()
    const decomposeQuestionNode = createDecomposeQuestionNode()
    const retrieveNode = createRetrieveNode(this.ragService, this.resumePublicationService, this.graphSearchService)
    const planNextNode = createPlanNextNode()
    const evaluateNode = createEvaluateNode()
    const ragGenerateNode = createRagGenerateNode()
    const fallbackAnswerNode = createFallbackAnswerNode()

    return new StateGraph(AiChatGraphState)
      .addNode('route_intent', routeIntentNode)
      .addNode('direct_answer', directAnswerNode)
      .addNode('decompose', decomposeNode)
      .addNode('decompose_question', decomposeQuestionNode)
      .addNode('retrieve', retrieveNode)
      .addNode('plan_next', planNextNode)
      .addNode('evaluate', evaluateNode)
      .addNode('rag_generate', ragGenerateNode)
      .addNode('fallback_answer', fallbackAnswerNode)
      .addEdge(START, 'route_intent')
      .addConditionalEdges('route_intent', afterRoute, {
        direct_answer: 'direct_answer',
        retrieve: 'decompose',
      })
      .addEdge('direct_answer', END)
      .addConditionalEdges('decompose', afterDecompose, {
        retrieve: 'retrieve',
        decompose_question: 'decompose_question',
      })
      .addEdge('decompose_question', 'retrieve')
      .addEdge('retrieve', 'plan_next')
      .addConditionalEdges('plan_next', afterPlan, {
        retrieve: 'retrieve',   // 🔄 回边循环
        evaluate: 'evaluate',   // 终止
      })
      .addConditionalEdges('evaluate', afterEvaluate, {
        rag_generate: 'rag_generate',
        fallback_answer: 'fallback_answer',
      })
      .addEdge('rag_generate', END)
      .addEdge('fallback_answer', END)
      .compile()
  }

  private getCompiledGraph() {
    if (!this.compiledGraph) {
      this.compiledGraph = this.compileLangGraph()
    }
    return this.compiledGraph
  }

  /**
   * 对话入口 — 灰度开关分流。
   *
   * - AI_CHAT_USE_LANGGRAPH=true  → 新 LangGraph 引擎
   * - AI_CHAT_USE_LANGGRAPH=false → 旧正则路由引擎
   */
  async generateAnswer(input: AiChatGraphInput): Promise<AiChatAnswerGenerationResult> {
    // 灰度开关：启用 LangGraph 引擎
    if (isLangGraphChatEnabled()) {
      return this.generateAnswerWithLangGraph(input)
    }

    return this.generateAnswerLegacy(input)
  }

  /**
   * LangGraph 引擎入口。
   *
   * 编译 StateGraph → invoke(state) → 提取 answer + blocks + citations。
   */
  /**
   * LangGraph 引擎主流程。
   *
   * ## 三步走
   *
   * 1. graph.invoke(state) → 8 节点链执行，返回 { strategy, citations, answer, evaluation, ... }
   * 2. 后处理桥接 legacy：evaluate 判定"不够"时用 generateAnswerFromCitations 回退
   * 3. 构建卡片：resume 卡片（project_card/experience_card）+ 自定义卡片（article/hobby）
   *
   * ## 异常处理
   *
   * LangGraph 调用失败 → generateAnswerLegacy() 回退旧引擎
   */
  private async generateAnswerWithLangGraph(
    input: AiChatGraphInput,
  ): Promise<AiChatAnswerGenerationResult> {
    const startedAt = Date.now()
    const question = input.question.trim()

    try {
      const graph = this.getCompiledGraph()

      const result = await graph.invoke(
        {
          question,
          locale: input.locale,
          maxRetrievals: 5,
        },
        { configurable: { onToken: input.onToken } },
      )

      // 桥接 legacy：获取简历 + 用检索结果构建卡片
      const citations = result.citations ?? []
      let answer: string = result.answer ?? ''

      // evaluate 判定"不够"时，若有 citation 仍尝试从上下文生成回答
      const evaluation = result.evaluation as { enough?: boolean } | undefined
      if (evaluation && !evaluation.enough && citations.length > 0) {
        answer = await this.generateAnswerFromCitations(question, citations, input.locale)
      }

      const snapshot = await this.resumePublicationService.getPublished()
      const resume = snapshot?.resume ?? null

      const resumeBlocks = resume
        ? this.buildAnswerBlocksFromResume(resume, citations, input.locale)
        : []
      const customBlocks = this.buildCustomBlocksFromCitations(question, citations, answer)

      const allBlocks = [...resumeBlocks, ...customBlocks].slice(0, 6)

      this.logger.log({
        event: 'ai-chat.langgraph.completed',
        question,
        strategy: result.strategy,
        routeReason: result.routeReason,
        citationCount: citations.length,
        blockCount: allBlocks.length,
        answerLength: answer.length,
        durationMs: Date.now() - startedAt,
      })

      return {
        answer,
        blocks: allBlocks,
        citations,
      }
    } catch (error) {
      this.logger.warn({
        event: 'ai-chat.langgraph.fallback',
        question,
        message: error instanceof Error ? error.message : String(error),
        durationMs: Date.now() - startedAt,
      })

      return this.generateAnswerLegacy(input)
    }
  }

  private async generateAnswerLegacy(input: AiChatGraphInput): Promise<AiChatAnswerGenerationResult> {
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

  /**
   * 旧引擎路由入口 — 正则驱动的意图识别 + 知识域匹配。
   *
   * ## 决策链
   *
   * 1. classifyQuestion() → greeting/short/negative → direct 路由
   * 2. isClearlyOutOfScopeQuestion() → blocked 路由
   * 3. probeSupplementCatalog() → 查询 user_docs 标题库（非语义，纯文本关键词匹配）
   * 4. hasResumeSignals / hasSupplementSignals / hasWorkOutsideNegation → 四路分支
   *
   * ## 四路分支
   *
   * | routeKind | 触发条件 | sourceTypes | 说明 |
   * |-----------|---------|-------------|------|
   * | hybrid | 简历+补充信号同时命中 | resume_core + user_docs | 联合检索 |
   * | supplement_only | 仅补充信号 或 probe 命中 | user_docs + knowledge | 只查补充资料 |
   * | resume_only | 默认兜底 | resume_core | 只查简历 |
   * | direct | greeting/short/negative | — | 跳过检索 |
   *
   * ## 与 LangGraph route_intent 的对比
   *
   * - 正则路由：确定性高，无 LLM 延迟，但规则僵化、需手动维护关键词
   * - LLM 路由：语义理解灵活，能处理变体问法，但有额外网络延迟
   */
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

  /**
   * 旧引擎检索节点 — 同 retrieve 节点，但走正则路由的 sourceTypes。
   *
   * 调用 RagService.ask() 执行检索+生成。
   * 额外输出 fallbackReason 用于 composeAnswer 判断是否需要回退。
   */
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
    const hasSupplementCitation = ragResult.citations.some(
      (item) => item.sourceType === 'user_docs' || item.sourceType === 'knowledge',
    )
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

  /**
   * 旧引擎回答组装 — 将检索结果转为 { answer, blocks, citations }。
   *
   * ## 处理链
   *
   * 1. filterDisplayRelevantCitations() → 过滤展示级 citation（hobby 去噪）
   * 2. 三道边界检查：
   *    a. supplement 路由无命中 → buildSupplementMissAnswer
   *    b. citation 为空且无简历摘要 → buildLowRelevanceAnswer
   *    c. topCitationScore < 0.1 → buildLowRelevanceAnswer
   * 3. 通过后构建卡片：
   *    - buildAnswerBlocksFromResume() → project_card / experience_card
   *    - buildCustomBlocksFromCitations() → article_card / hobby_card / project_card
   * 4. 渲染结果：answer 有值 + citations 有数据 → 直接返回
   *    否则按 routeKind 决定回退方案
   */
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
      (item) => item.sourceType === 'user_docs' || item.sourceType === 'knowledge',
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

  /**
   * 兜底回答生成 — 用简历摘要拼 prompt → LLM 生成。
   *
   * 在以下场景触发：
   * 1. resume_only 路由 + 检索无结果 → 用简历摘要兜底
   * 2. LangGraph 异常回退时的 resume_only 兜底
   *
   * 设计意图：即使 RAG 检索失败，也能用简历摘要（StandardResume → 文本摘要）
   * 给用户一个基本的、基于真实简历信息的回答。
   */
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

  /**
   * 从已有 citation 生成回答（evaluate 判定不够时的回退）。
   *
   * 不走 RAG 检索，直接用现有 citations 拼 context → LLM 生成。
   */
  /**
   * 从已有 citation 拼 context → LLM 生成回答。
   *
   * ## 使用场景
   *
   * LangGraph evaluate 节点判定"不够"但 citations 有数据时调用。
   * 不走 RagService.ask()（不再检索），直接用现有 citations 的 title+snippet 拼 prompt。
   *
   * ## 设计意图
   *
   * evaluate 判定 retrieval 信息不足，但仍有部分相关内容——与其完全放弃，
   * 不如用已有片段尝试生成回答。这样比"我不知道"的用户体验更好。
   */
  private async generateAnswerFromCitations(
    question: string,
    citations: RagAskCitation[],
    locale: AiChatLocale,
  ): Promise<string> {
    const context = citations
      .slice(0, 6)
      .map((item, index) => `[#${index + 1}] ${item.title}\n${item.snippet}`)
      .join('\n\n')

    const systemPrompt = locale === 'en'
      ? 'You are a resume assistant. Answer based on the context provided. If insufficient, say so briefly.'
      : '你是简历助手。根据提供的上下文回答问题。如果信息不足，简要说明。'

    const prompt = `Context:\n${context}\n\nQuestion: ${question}\n\nAnswer:`

    try {
      const result = await this.aiService.generateText({ systemPrompt, prompt })
      return result.text
    } catch {
      return locale === 'en'
        ? "I found some related content but couldn't generate a complete answer. Try asking more specifically?"
        : '找到了一些相关内容，但暂时无法生成完整回答。可以换个方式问得更具体些？'
    }
  }

  /**
   * 从简历 citation 构建富卡片。
   *
   * 根据 citation.section 分两类：
   * - project → 匹配 StandardResume.projects → project_card（名称/角色/周期/摘要/技术栈/亮点 top3）
   * - experience → 匹配 StandardResume.experiences → experience_card
   *
   * 匹配靠 findProjectByCitation / findExperienceByCitation：
   * 双向包含匹配（citation.title 和 resume.title 互相包含对方）。
   * 每种最多 1 张，总量 slice(0, 2)。
   */
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

  /**
   * 从 user_docs / knowledge citation 构建富卡片。
   *
   * ## 三种卡片类型
   *
   * | contentType 匹配 | 卡片类型 | 包含字段 |
   * |-----------------|---------|---------|
   * | article/tech_blog/knowledge_column/general/media | article_card | title/summary/url/imageUrl/keywords/media/linkDisplayTitle |
   * | hobby | hobby_card | title/description/url/imageUrl/keywords/media/linkDisplayTitle |
   * | project | project_card | title/summary/technologies/url/imageUrl |
   *
   * ## 数据来源
   *
   * 所有数据从 citation.richCard 中提取（admin 上传 user_docs 时填充的元数据）。
   * 卡片去重：同一 contentType + title 只取第一个。
   * 总量 slice(0, 6)。
   *
   * ## 注意
   *
   * - resume_core 源的 citation 不会进入此函数（由 buildAnswerBlocksFromResume 处理）
   * - knowledge 源（博客文章）作为 article_card 展示
   */
  private buildCustomBlocksFromCitations(
    question: string,
    citations: RagAskCitation[],
    answerText?: string,
  ): AiChatMessageBlock[] {
    const blocks: AiChatMessageBlock[] = []
    const seen = new Set<string>()

    for (const citation of citations) {
      // 只处理 user_docs 和 knowledge 源（排除 resume_core）
      if (citation.sourceType !== 'user_docs' && citation.sourceType !== 'knowledge') continue
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
          linkDisplayTitle: richCard?.linkDisplayTitle,
        })
      } else if (contentType === 'hobby') {
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
          linkDisplayTitle: richCard?.linkDisplayTitle,
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

    return blocks.slice(0, 6)
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
