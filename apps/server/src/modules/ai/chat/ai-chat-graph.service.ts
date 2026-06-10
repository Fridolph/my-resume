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
import { RagService } from '../rag/rag.service'
import type { RagAskCitation } from '../rag/rag.types'
import type {
  AiChatAnswerGenerationResult,
  AiChatExperienceCardBlock,
  AiChatLocale,
  AiChatMessageBlock,
  AiChatProjectCardBlock,
} from './ai-chat.types'

const DEFAULT_CHAT_LIMIT = 15

type QuestionClass = 'greeting' | 'short' | 'negative' | 'normal'
type GraphRouteIntent = 'direct' | 'rag' | 'blocked'

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
  knowledgeDomains?: RagKnowledgeDomain[]
  reason: string
}

interface GraphRetrievalResult {
  knowledgeDomains: RagKnowledgeDomain[]
  ragResult: Awaited<ReturnType<RagService['ask']>>
  resume: StandardResume | null
  resumeSummary: string
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

function resolveKnowledgeDomains(question: string): RagKnowledgeDomain[] | undefined {
  const lower = question.toLowerCase()
  const domains = new Set<RagKnowledgeDomain>()

  if (/项目|作品|案例|project|case|portfolio|agent|rag|ai/.test(lower)) domains.add('projects')
  if (/工作|经历|公司|团队|管理|经验|experience|company|team|lead/.test(lower)) domains.add('experience')
  if (/技能|技术栈|会什么|擅长|skill|tech|stack/.test(lower)) domains.add('skills')
  if (/兴趣|爱好|特长|音乐|羽毛球|hobby|music|badminton/.test(lower)) domains.add('hobbies')
  if (/文章|博客|创作|写作|学习|blog|article|writing|media/.test(lower)) domains.add('writing_media')

  return domains.size > 0 ? [...domains] : undefined
}

function mergeResumeCoreKnowledgeDomains(
  domains: readonly RagKnowledgeDomain[] | undefined,
): RagKnowledgeDomain[] {
  return Array.from(new Set<RagKnowledgeDomain>(['resume_core', ...(domains ?? [])]))
}

function isClearlyOutOfScopeQuestion(question: string): boolean {
  const lower = question.toLowerCase()
  const resumeRelated = /我|你|简历|项目|经历|工作|公司|技能|技术|特长|兴趣|爱好|文章|博客|学习|职业|求职|resume|project|experience|skill|hobby|career|work|blog|article/.test(lower)

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

    try {
      const route = this.routeIntentAndDomain(normalized)
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

      return this.generateFallbackAnswer(normalized)
    }
  }

  private normalizeInput(input: AiChatGraphInput): NormalizedGraphInput {
    return {
      ...input,
      question: input.question.trim(),
    }
  }

  private routeIntentAndDomain(input: NormalizedGraphInput): GraphRouteDecision {
    const classification = classifyQuestion(input.question)

    if (classification !== 'normal') {
      return {
        classification,
        intent: 'direct',
        reason: `rule:${classification}`,
      }
    }

    return {
      classification,
      intent: 'rag',
      knowledgeDomains: resolveKnowledgeDomains(input.question),
      reason: 'rag:domain_route',
    }
  }

  private boundaryGuard(
    input: NormalizedGraphInput,
    route: GraphRouteDecision,
  ): AiChatAnswerGenerationResult | null {
    if (route.intent === 'rag' && isClearlyOutOfScopeQuestion(input.question)) {
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
    const snapshot = await this.resumePublicationService.getPublished()
    const resume = snapshot?.resume ?? null
    const resumeSummary = resume ? buildResumeSummary(resume, input.locale) : ''
    const knowledgeDomains = mergeResumeCoreKnowledgeDomains(route.knowledgeDomains)
    const ragResult = await this.ragService.ask(
      input.question,
      DEFAULT_CHAT_LIMIT,
      input.locale,
      {
        vectorScope: 'published',
        knowledgeDomains,
      },
      input.onToken ? { onToken: input.onToken } : undefined,
    )

    return {
      knowledgeDomains,
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
    if (retrieval.ragResult.citations.length === 0 && !retrieval.resumeSummary) {
      const topScore = retrieval.ragResult.matches[0]?.score ?? 0
      return buildLowRelevanceAnswer(input.question, topScore, input.locale)
    }

    const topCitationScore = retrieval.ragResult.citations[0]?.score
    if (typeof topCitationScore === 'number' && topCitationScore < 0.1) {
      return buildLowRelevanceAnswer(input.question, topCitationScore, input.locale)
    }

    const resumeBlocks = retrieval.resume
      ? this.buildAnswerBlocksFromResume(retrieval.resume, retrieval.ragResult.citations, input.locale)
      : []
    const customBlocks = this.buildCustomBlocksFromCitations(retrieval.ragResult.citations)
    const cardBlocks = [...resumeBlocks, ...customBlocks].slice(0, 4)

    if (retrieval.ragResult.answer && retrieval.ragResult.citations.length > 0) {
      return {
        answer: retrieval.ragResult.answer,
        citations: retrieval.ragResult.citations,
        blocks: cardBlocks,
      }
    }

    return this.generateResumeFallbackAnswer(input, retrieval.resumeSummary, cardBlocks, route)
  }

  private async generateFallbackAnswer(input: NormalizedGraphInput): Promise<AiChatAnswerGenerationResult> {
    const snapshot = await this.resumePublicationService.getPublished()
    const resumeSummary = snapshot?.resume ? buildResumeSummary(snapshot.resume, input.locale) : ''

    if (!resumeSummary) {
      return buildIrrelevantAnswer(input.locale)
    }

    return this.generateResumeFallbackAnswer(input, resumeSummary, [], {
      classification: 'normal',
      intent: 'rag',
      reason: 'fallback:graph_error',
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
      reason: route.reason,
      knowledgeDomains: mergeResumeCoreKnowledgeDomains(route.knowledgeDomains),
      question: input.question,
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

  private buildCustomBlocksFromCitations(citations: RagAskCitation[]): AiChatMessageBlock[] {
    const blocks: AiChatMessageBlock[] = []
    const seen = new Set<string>()

    for (const citation of citations) {
      if (citation.sourceType !== 'user_docs') continue
      const contentType = citation.contentType
      if (!contentType || seen.has(`${contentType}:${citation.title}`)) continue
      seen.add(`${contentType}:${citation.title}`)

      if (contentType === 'article') {
        const richCard = citation.richCard

        blocks.push({
          type: 'article_card',
          title: richCard?.title ?? citation.title,
          summary: richCard?.description ?? citation.snippet,
          url: richCard?.url ?? citation.sourcePath,
          imageUrl: richCard?.imageUrl,
          publishedAt: richCard?.publishedAt,
          keywords: richCard?.keywords ?? citation.tags ?? [],
          media: richCard?.media,
        })
      } else if (contentType === 'media') {
        const richCard = citation.richCard

        blocks.push({
          type: 'media_card',
          title: richCard?.title ?? citation.title,
          description: richCard?.description ?? citation.snippet,
          url: richCard?.url ?? citation.sourcePath ?? '',
          imageUrl: richCard?.imageUrl,
          thumbnailUrl: richCard?.thumbnailUrl,
        })
      } else if (contentType === 'hobby') {
        const richCard = citation.richCard

        blocks.push({
          type: 'hobby_card',
          title: richCard?.title ?? citation.title,
          description: richCard?.description ?? citation.snippet,
          url: richCard?.url ?? citation.sourcePath,
          imageUrl: richCard?.imageUrl,
          keywords: richCard?.keywords ?? citation.tags ?? [],
          media: richCard?.media,
        })
      } else if (contentType === 'project') {
        const richCard = citation.richCard

        blocks.push({
          type: 'project_card',
          title: richCard?.title ?? citation.title,
          subtitle: '补充项目资料',
          period: '',
          summary: richCard?.description ?? citation.snippet,
          technologies: richCard?.keywords ?? citation.tags ?? [],
          highlights: [],
          url: richCard?.url ?? citation.sourcePath,
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
      knowledgeDomains: route.knowledgeDomains,
      reason: route.reason,
      question: input.question,
      durationMs: Date.now() - startedAt,
      ...extra,
    })
  }
}
