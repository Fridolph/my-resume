import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { createHash, randomUUID } from 'node:crypto'
import { z } from 'zod'

import { AiService } from '../application/services/ai.service'
import { ResumePublicationService } from '../../resume/application/services/resume-publication.service'
import type {
  LocalizedText,
  ResumeExperienceItem,
  ResumeProjectItem,
  StandardResume,
} from '../../resume/domain/standard-resume'
import { RagService } from '../rag/rag.service'
import type { RagAskCitation } from '../rag/rag.types'
import { buildAiChatSummaryPrompt, AI_CHAT_SUMMARY_SYSTEM_PROMPT } from './prompts/ai-chat-summary.prompt'
import { buildRagAskSystemPrompt } from '../rag/prompts/rag-ask.prompt'
import { AiChatGraphService } from './ai-chat-graph.service'
import { AiChatRepository } from './ai-chat.repository'
import type {
  AiChatAnswerGenerationResult,
  AiChatAskMessageInput,
  AiChatCloseSessionInput,
  AiChatClaimPublicSessionInput,
  AiChatExperienceCardBlock,
  AiChatIssueUseKeyInput,
  AiChatLeadInput,
  AiChatLeadSummary,
  AiChatLocale,
  AiChatMessageBlock,
  AiChatMessageSnapshot,
  AiChatProjectCardBlock,
  AiChatSessionListItem,
  AiChatSessionSnapshot,
  AiChatSummarySnapshot,
  AiChatUseKeySummary,
  AiChatPublicSessionClaimResult,
} from './ai-chat.types'

const MAX_CHAT_TURNS = 20
const SUMMARY_TRIGGER_TURN = 10
const DEFAULT_CHAT_LIMIT = 15
const PUBLIC_CHAT_POLICY_VERSION = 'm23-public-ip-v1'
const PUBLIC_CHAT_SOURCE_TAG = 'public-ip'
const PUBLIC_CHAT_ISSUER = 'system-public-chat'
type AiChatUseKeyRecord = Awaited<ReturnType<AiChatRepository['findLatestUseKeyByLeadId']>> | null
type AiChatSessionBundle = NonNullable<Awaited<ReturnType<AiChatRepository['getSessionBundle']>>>
const AI_CHAT_SUMMARY_SCHEMA = z.object({
  visitorFocus: z.string(),
  aiClosing: z.string(),
  keywords: z.array(z.string()).max(15),
})

function readLocalizedText(value: LocalizedText, locale: AiChatLocale): string {
  return (locale === 'en' ? value.en : value.zh || value.en || value.zh).trim()
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

function resolveCustomCardSummary(citation: RagAskCitation): string {
  return citation.richCard?.summary?.trim() || citation.richCard?.description?.trim() || citation.snippet
}

function buildCustomCardMedia(citation: RagAskCitation) {
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

/**
 * 将已发布简历转化为 LLM 可直接使用的简洁结构化摘要。
 *
 * 注入到 system prompt 中，让 LLM 不必完全依赖 RAG 检索即可回答基础事实性问题。
 */
function buildResumeSummary(
  resume: StandardResume,
  locale: AiChatLocale,
): string {
  const l = (v: LocalizedText) => readLocalizedText(v, locale)
  const lines: string[] = []

  // 基本信息
  lines.push(`姓名：${l(resume.profile.fullName)}`)
  lines.push(`角色：${l(resume.profile.headline)}`)
  lines.push(`所在地：${l(resume.profile.location)}`)
  if (resume.profile.email) lines.push(`邮箱：${resume.profile.email}`)
  if (resume.profile.website) lines.push(`网站：${resume.profile.website}`)

  // 工作经历
  if (resume.experiences.length > 0) {
    lines.push('')
    lines.push('工作经历：')
    for (const exp of resume.experiences) {
      const period = [exp.startDate, exp.endDate || '至今'].filter(Boolean).join(' - ')
      lines.push(`  · ${l(exp.companyName)} | ${l(exp.role)} | ${period}`)
      const summary = l(exp.summary)
      if (summary) lines.push(`    ${summary}`)
      if (exp.technologies.length > 0) lines.push(`    技术栈：${exp.technologies.join('、')}`)
    }
  }

  // 教育
  if (resume.education.length > 0) {
    lines.push('')
    lines.push('教育背景：')
    for (const edu of resume.education) {
      const period = [edu.startDate, edu.endDate].filter(Boolean).join(' - ')
      lines.push(`  · ${l(edu.schoolName)} | ${l(edu.degree)} ${l(edu.fieldOfStudy)} | ${period}`)
    }
  }

  // 项目
  if (resume.projects.length > 0) {
    lines.push('')
    lines.push('项目经历：')
    for (const proj of resume.projects.slice(0, 5)) {
      const period = [proj.startDate, proj.endDate || '至今'].filter(Boolean).join(' - ')
      lines.push(`  · ${l(proj.name)} | ${l(proj.role)} | ${period}`)
    }
  }

  // 技能
  if (resume.skills.length > 0) {
    lines.push('')
    lines.push('技能：')
    for (const sk of resume.skills) {
      if (sk.keywords.length > 0) {
        lines.push(`  · ${l(sk.name)}：${sk.keywords.map((k) => l(k)).join('、')}`)
      }
    }
  }

  // 亮点/优势
  if (resume.highlights.length > 0) {
    lines.push('')
    lines.push('核心竞争力/亮点：')
    for (const hl of resume.highlights) {
      lines.push(`  · ${l(hl.title)} — ${l(hl.description)}`)
    }
  }

  return lines.join('\n')
}

function formatPeriod(startDate: string, endDate: string): string {
  return [startDate, endDate].filter(Boolean).join(' - ')
}

function normalizeOptionalText(value?: string | null): string {
  return value?.trim() ?? ''
}

function buildUseKeyValue() {
  return `FY-${randomUUID().slice(0, 8).toUpperCase()}`
}

function normalizeIpAddress(ipAddress: string) {
  const trimmed = ipAddress.trim()

  // 本地开发环境 IP 归一：所有 localhost 变体统一为 127.0.0.1
  if (
    trimmed === '::1' ||
    trimmed === 'localhost' ||
    trimmed.startsWith('127.') ||
    trimmed === '0:0:0:0:0:0:0:1'
  ) {
    return '127.0.0.1'
  }

  if (trimmed.startsWith('::ffff:')) {
    return trimmed.slice('::ffff:'.length)
  }

  return trimmed
}

function buildPublicLeadSourceKey(ipAddress: string) {
  const ipHash = createHash('sha256').update(ipAddress).digest('hex').slice(0, 16)
  return `${PUBLIC_CHAT_SOURCE_TAG}:${ipHash}`
}

function buildLocalDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function isSameLocalDate(left: Date, right: Date) {
  return buildLocalDateKey(left) === buildLocalDateKey(right)
}

function isPublicChatBundle(bundle: AiChatSessionBundle) {
  return (
    bundle.lead.sourceTag === PUBLIC_CHAT_SOURCE_TAG ||
    bundle.useKey.issuedByUserId === PUBLIC_CHAT_ISSUER
  )
}

function chooseStructuredMethod(provider: { provider: string; model: string }) {
  const providerName = provider.provider.toLowerCase()
  const modelName = provider.model.toLowerCase()

  return providerName.includes('deepseek') || modelName.includes('reasoner')
    ? 'jsonMode'
    : 'functionCalling'
}

function chunkAnswerText(answer: string): string[] {
  const compact = answer.trim()

  if (!compact) {
    return []
  }

  const segments = compact.match(/.{1,28}/g)
  return segments?.length ? segments : [compact]
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

  // 分数极低（< 0.05）：无任何关联
  if (topScore < 0.05) {
    if (isShort) {
      return buildShortAnswer(question, locale)
    }
    return buildIrrelevantAnswer(locale)
  }

  // 低分但有点关联（0.05~0.1）：模糊提示，鼓励更具体的提问
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

  // 接近阈值：礼貌告知检索不足
  if (isShort) {
    return buildShortAnswer(question, locale)
  }

  return buildIrrelevantAnswer(locale)
}

type QuestionClass = 'greeting' | 'short' | 'negative' | 'normal'

/**
 * 快速问题分类（纯规则，不调 LLM）。
 *
 * 设计思路：
 * - greeting/测试/打招呼类 → 直接返回自我介绍引导词，不消耗 AI 调用
 * - 否定/消极情绪 → 共情引导
 * - 极短无意义输入 → 通用引导，但有疑问词时 fallthrough 到 RAG
 * - 其余 → 走完整 RAG + LLM
 */
function classifyQuestion(question: string): QuestionClass {
  const trimmed = question.trim()
  const lower = trimmed.toLowerCase()

  // 中英文打招呼/简单招呼（≤15 字且匹配关键词）
  const greetingPatterns = [
    'hello', 'hi', 'hey', 'yo', 'hola', 'good morning', 'good afternoon',
    '你好', '哈喽', '嗨', '在吗', '有人在吗', '早', '晚上好', '下午好',
    'who are you', 'what can you do', 'what can you',
    // 测试/调试类输入，不走 AI
    'test', 'testing', '测试', '测试一下', '试一下', '试下',
    'ping', 'pong', 'help',
    '123', '1234', '12345',
  ]
  if (trimmed.length <= 15 && greetingPatterns.some((p) => lower.includes(p))) {
    return 'greeting'
  }

  // 纯否定/消极情绪（无具体提问内容）
  const negativePatterns = [
    '好烦', '不开心', '难过', '伤心', '郁闷', '无聊', '累了',
    'sad', 'upset', 'tired', 'boring', 'frustrated',
  ]
  if (trimmed.length <= 15 && negativePatterns.some((p) => lower.includes(p))) {
    return 'negative'
  }

  // 极短无意义输入（非问题、非招呼）
  if (trimmed.length <= 4 && !/[?？]/.test(trimmed)) {
    return 'short'
  }

  return 'normal'
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

function buildShortAnswer(
  question: string,
  locale: AiChatLocale,
): AiChatAnswerGenerationResult {
  if (locale === 'en') {
    // 检测到疑问词当成基础问题用 LLM 回答，只在无意义短输入时才用模板
    if (/what|how|why|when|where|who|can you|tell me|do you/i.test(question)) {
      return { answer: '', blocks: [], citations: [] } // fallthrough to RAG
    }
  }
  if (/为什么|什么|怎么|如何|哪里|是谁|能不能|可以/.test(question)) {
    return { answer: '', blocks: [], citations: [] } // fallthrough to RAG
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

function mapLead(record: {
  companyName: string | null
  contact: string | null
  createdAt: Date
  displayName: string
  id: string
  locale: string
  message: string
  status: string
  updatedAt: Date
}): AiChatLeadSummary {
  return {
    id: record.id,
    locale: record.locale as AiChatLocale,
    displayName: record.displayName,
    companyName: record.companyName ?? '',
    contact: record.contact ?? '',
    message: record.message,
    status: record.status as AiChatLeadSummary['status'],
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }
}

function mapUseKey(record: {
  claimedAt: Date | null
  createdAt: Date
  expiresAt: Date | null
  id: string
  leadId: string
  revokedAt: Date | null
  sessionId: string | null
  status: string
  updatedAt: Date
  useKey: string
  usedTurns: number
  maxTurns: number
}): AiChatUseKeySummary {
  return {
    id: record.id,
    useKey: record.useKey,
    leadId: record.leadId,
    sessionId: record.sessionId ?? null,
    status: record.status as AiChatUseKeySummary['status'],
    maxTurns: record.maxTurns,
    usedTurns: record.usedTurns,
    expiresAt: record.expiresAt?.toISOString() ?? null,
    claimedAt: record.claimedAt?.toISOString() ?? null,
    revokedAt: record.revokedAt?.toISOString() ?? null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }
}

@Injectable()
export class AiChatService {
  private readonly logger = new Logger(AiChatService.name)

  constructor(
    @Inject(AiChatRepository)
    private readonly aiChatRepository: AiChatRepository,
    @Inject(AiService)
    private readonly aiService: AiService,
    @Inject(RagService)
    private readonly ragService: RagService,
    @Inject(ResumePublicationService)
    private readonly resumePublicationService: ResumePublicationService,
    @Inject(AiChatGraphService)
    private readonly aiChatGraphService: AiChatGraphService,
  ) {}

  async submitLead(input: AiChatLeadInput) {
    const now = new Date()
    const lead = await this.aiChatRepository.createLead({
      id: randomUUID(),
      locale: input.locale,
      displayName: input.displayName.trim(),
      companyName: normalizeOptionalText(input.companyName) || null,
      contact: normalizeOptionalText(input.contact) || null,
      message: input.message.trim(),
      sourceTag: input.sourceTag ?? null,
      sourceKey: input.sourceKey ?? null,
      metadataJson: input.metadataJson ?? null,
      status: 'submitted',
      createdAt: now,
      updatedAt: now,
    })

    if (!lead) {
      throw new Error('Failed to create AI chat lead')
    }

    return mapLead(lead)
  }

  async issueUseKey(input: AiChatIssueUseKeyInput) {
    const lead = await this.aiChatRepository.findLeadById(input.leadId)

    if (!lead) {
      throw new NotFoundException('AI chat lead not found')
    }

    const now = new Date()
    const useKeyRecord = await this.aiChatRepository.createUseKey({
      id: randomUUID(),
      useKey: buildUseKeyValue(),
      leadId: input.leadId,
      issuedByUserId: input.issuedByUserId,
      status: 'issued',
      maxTurns: MAX_CHAT_TURNS,
      usedTurns: 0,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      createdAt: now,
      updatedAt: now,
    })

    await this.aiChatRepository.updateLeadStatus(input.leadId, 'issued', now)

    if (!useKeyRecord) {
      throw new Error('Failed to issue AI chat useKey')
    }

    return mapUseKey(useKeyRecord)
  }

  async revokeUseKey(useKeyValue: string) {
    const useKey = await this.aiChatRepository.findUseKeyByValue(useKeyValue)

    if (!useKey) {
      throw new NotFoundException('AI chat useKey not found')
    }

    const now = new Date()
    const updated = await this.aiChatRepository.updateUseKey({
      id: useKey.id,
      status: 'revoked',
      revokedAt: now,
      updatedAt: now,
    })

    if (!updated) {
      throw new Error('Failed to revoke AI chat useKey')
    }

    return mapUseKey(updated)
  }

  async claimUseKey(input: { locale?: AiChatLocale; useKey: string }): Promise<AiChatSessionSnapshot> {
    await this.aiChatRepository.expireOverdueUseKeys(new Date())
    const relation = await this.aiChatRepository.findLeadByUseKey(input.useKey)

    if (!relation) {
      throw new NotFoundException('AI chat useKey not found')
    }

    if (relation.useKey.status === 'revoked' || relation.useKey.status === 'expired') {
      throw new ForbiddenException('当前 useKey 不可用，请联系管理员重新发放')
    }

    if (relation.useKey.sessionId) {
      return this.getPublicSessionSnapshot(relation.useKey.sessionId, input.useKey)
    }

    const now = new Date()
    const session = await this.aiChatRepository.createSession({
      id: randomUUID(),
      leadId: relation.lead.id,
      useKeyId: relation.useKey.id,
      locale: input.locale ?? (relation.lead.locale as AiChatLocale),
      status: 'open',
      turnCount: 0,
      createdAt: now,
      updatedAt: now,
    })

    if (!session) {
      throw new Error('Failed to create AI chat session')
    }

    await this.aiChatRepository.updateUseKey({
      id: relation.useKey.id,
      sessionId: session.id,
      status: 'claimed',
      claimedAt: now,
      updatedAt: now,
    })

    return this.getPublicSessionSnapshot(session.id, input.useKey)
  }

  async claimPublicSession(
    input: AiChatClaimPublicSessionInput,
  ): Promise<AiChatPublicSessionClaimResult> {
    if (!input.consentAccepted) {
      throw new BadRequestException('需要先同意访客对话提示，才能开始 AI 对话')
    }

    const normalizedIp = normalizeIpAddress(input.ipAddress)

    if (!normalizedIp) {
      throw new BadRequestException('无法识别当前访客 IP，请稍后重试')
    }

    const now = new Date()
    const sourceKey = buildPublicLeadSourceKey(normalizedIp)
    const lead =
      (await this.aiChatRepository.findLatestLeadBySourceKey(sourceKey)) ??
      (await this.aiChatRepository.createLead({
        id: randomUUID(),
        locale: input.locale ?? 'zh',
        displayName: input.locale === 'en' ? 'Web visitor' : '公开站访客',
        companyName: null,
        contact: null,
        message:
          input.locale === 'en'
            ? 'Public web AI chat session created after privacy consent.'
            : '访客已同意公开站 AI 对话提示，系统自动创建当日会话。',
        sourceTag: PUBLIC_CHAT_SOURCE_TAG,
        sourceKey,
        metadataJson: {
          consentedAt: now.toISOString(),
          ipAddress: normalizedIp,
          policyVersion: PUBLIC_CHAT_POLICY_VERSION,
          userAgent: normalizeOptionalText(input.userAgent) || null,
        },
        status: 'issued',
        createdAt: now,
        updatedAt: now,
      }))

    if (!lead) {
      throw new Error('Failed to create public AI chat lead')
    }

    // Public chat 是“同一 IP / 同一会话 / 每个自然日 20 轮”。
    // useKey/session 跨天复用，具体每日额度由 snapshot/message 入口幂等 rollover。
    const latestUseKey = await this.aiChatRepository.findLatestUseKeyByLeadId(lead.id)
    let reusableUseKey: AiChatUseKeyRecord = null

    if (latestUseKey) {
      if (latestUseKey.status === 'revoked') {
        await this.aiChatRepository.deleteUseKey(latestUseKey.useKey)
      } else if (latestUseKey.status !== 'expired') {
        reusableUseKey = latestUseKey
      }
    }

    const useKeyRecord = reusableUseKey ??
      (await this.aiChatRepository.createUseKey({
          id: randomUUID(),
          useKey: buildUseKeyValue(),
          leadId: lead.id,
          issuedByUserId: PUBLIC_CHAT_ISSUER,
          status: 'issued',
          maxTurns: MAX_CHAT_TURNS,
          usedTurns: 0,
          createdAt: now,
          updatedAt: now,
        }))

    if (!useKeyRecord) {
      throw new Error('Failed to create public AI chat useKey')
    }

    let session = useKeyRecord.sessionId
      ? await this.getPublicSessionSnapshot(useKeyRecord.sessionId, useKeyRecord.useKey)
      : null

    if (!session) {
      session = await this.claimUseKey({
        locale: input.locale ?? (lead.locale as AiChatLocale),
        useKey: useKeyRecord.useKey,
      })
    }

    return {
      consentRecordedAt: now.toISOString(),
      policyVersion: PUBLIC_CHAT_POLICY_VERSION,
      session,
      turnsPerDay: MAX_CHAT_TURNS,
      useKey: useKeyRecord.useKey,
    }
  }

  async getPublicSessionSnapshot(sessionId: string, useKeyValue: string): Promise<AiChatSessionSnapshot> {
    let bundle = await this.requireSessionBundle(sessionId)

    if (bundle.useKey.useKey !== useKeyValue) {
      throw new ForbiddenException('当前会话与 useKey 不匹配')
    }

    bundle = await this.ensurePublicDailyQuotaCurrent(bundle)

    return this.buildSessionSnapshot(bundle)
  }

  async closeSession(input: AiChatCloseSessionInput) {
    const bundle = await this.requireSessionBundle(input.sessionId)

    if (bundle.useKey.useKey !== input.useKey) {
      throw new ForbiddenException('当前会话与 useKey 不匹配')
    }

    const now = new Date()
    await this.aiChatRepository.updateSession({
      id: bundle.session.id,
      status: 'closed',
      closedAt: now,
      updatedAt: now,
    })

    return this.getPublicSessionSnapshot(bundle.session.id, input.useKey)
  }

  async adminResetSession(sessionId: string) {
    const bundle = await this.requireSessionBundle(sessionId)
    const now = new Date()

    await this.aiChatRepository.deleteMessagesBySessionId(sessionId)
    await this.aiChatRepository.resetSessionTurns({
      sessionId,
      useKeyId: bundle.useKey.id,
      now,
    })

    return this.getAdminSessionSnapshot(sessionId)
  }

  async adminClearMessages(sessionId: string) {
    await this.requireSessionBundle(sessionId)
    await this.aiChatRepository.deleteMessagesBySessionId(sessionId)
    return this.getAdminSessionSnapshot(sessionId)
  }

  async adminDeleteUseKey(useKeyValue: string) {
    const useKey = await this.aiChatRepository.findUseKeyByValue(useKeyValue)
    if (!useKey) {
      throw new NotFoundException('useKey 不存在')
    }
    // 级联删除：useKey → session → messages（通过 FK ON DELETE CASCADE）
    await this.aiChatRepository.deleteUseKey(useKeyValue)
    return { deleted: true, useKey: useKeyValue }
  }

  async createAssistantReply(
    input: AiChatAskMessageInput,
    streamCallbacks?: {
      onStart?: (payload: {
        assistantMessageId: string
        remainingTurns: number
        sessionId: string
        turnCount: number
      }) => void
      onToken?: (token: string) => void
      onCitation?: (citation: RagAskCitation) => void
      onBlock?: (block: AiChatMessageBlock) => void
    },
  ): Promise<{
    remainingTurns: number
    session: AiChatSessionSnapshot
    summary: AiChatSummarySnapshot | null
    userMessage: AiChatMessageSnapshot
    assistantMessage: AiChatMessageSnapshot
  }> {
    let bundle = await this.requireSessionBundle(input.sessionId)

    if (bundle.useKey.useKey !== input.useKey) {
      throw new ForbiddenException('当前会话与 useKey 不匹配')
    }

    if (bundle.useKey.status === 'revoked' || bundle.useKey.status === 'expired') {
      throw new ForbiddenException('当前 useKey 不可继续使用')
    }

    bundle = await this.ensurePublicDailyQuotaCurrent(bundle)

    if (bundle.session.status === 'closed' || bundle.session.turnCount >= bundle.useKey.maxTurns) {
      throw new BadRequestException('当前会话已结束，无法继续提问')
    }

    const now = new Date()
    const nextTurnCount = bundle.session.turnCount + 1
    const locale = input.locale ?? (bundle.session.locale as AiChatLocale)

    const userMessageRecord = await this.aiChatRepository.createMessage({
      id: randomUUID(),
      sessionId: bundle.session.id,
      role: 'user',
      content: input.content.trim(),
      turnIndex: nextTurnCount,
      createdAt: now,
    })

    if (!userMessageRecord) {
      throw new Error('Failed to persist AI chat user message')
    }

    const assistantMessageId = randomUUID()
    const remainingTurns = bundle.useKey.maxTurns - nextTurnCount

    streamCallbacks?.onStart?.({
      assistantMessageId,
      remainingTurns,
      sessionId: bundle.session.id,
      turnCount: nextTurnCount,
    })

    const answerResult = await this.generateAnswerWithGraph({
      locale,
      question: input.content.trim(),
      onToken: streamCallbacks?.onToken,
    })

    // 流式回调：答案生成完成后推送 citations 和 blocks
    for (const citation of answerResult.citations) {
      streamCallbacks?.onCitation?.(citation)
    }

    for (const block of answerResult.blocks) {
      streamCallbacks?.onBlock?.(block)
    }

    const assistantMessageRecord = await this.aiChatRepository.createMessage({
      id: assistantMessageId,
      sessionId: bundle.session.id,
      role: 'assistant',
      content: answerResult.answer,
      turnIndex: nextTurnCount,
      answerBlocksJson: answerResult.blocks,
      citationsJson: answerResult.citations,
      createdAt: new Date(),
    })

    if (!assistantMessageRecord) {
      throw new Error('Failed to persist AI chat assistant message')
    }

    let generatedSummary: AiChatSummarySnapshot | null = null
    let finalSessionStatus: 'open' | 'closed' = 'open'
    let finalSummaryText: string | null = bundle.session.finalSummary ?? null
    let interimSummaryText: string | null = bundle.session.interimSummary ?? null
    let focusKeywords: string[] | null = (bundle.session.focusKeywordsJson as string[] | null) ?? null

    // 每 20 轮触发一次总结（20, 40, 60...）
    if (nextTurnCount > 0 && nextTurnCount % 20 === 0) {
      const stageLabel = `turn-${nextTurnCount}`
      generatedSummary = await this.generateConversationSummary({
        locale,
        sessionId: bundle.session.id,
        stage: stageLabel,
      })

      await this.aiChatRepository.createMessage({
        id: randomUUID(),
        sessionId: bundle.session.id,
        role: 'system',
        content: generatedSummary.summary,
        turnIndex: nextTurnCount,
        answerBlocksJson: [
          {
            type: 'summary',
            stage: generatedSummary.stage,
            title: `第 ${nextTurnCount} 轮总结`,
            summary: generatedSummary.summary,
            keywords: generatedSummary.keywords,
          },
        ],
        createdAt: new Date(generatedSummary.generatedAt),
      })

      if (generatedSummary.stage === 'turn-20') {
        finalSessionStatus = 'closed'
        finalSummaryText = generatedSummary.summary
        focusKeywords = generatedSummary.keywords
      } else {
        interimSummaryText = generatedSummary.summary
      }
    }

    await this.aiChatRepository.updateSession({
      id: bundle.session.id,
      status: finalSessionStatus,
      turnCount: nextTurnCount,
      interimSummary: interimSummaryText,
      finalSummary: finalSummaryText,
      focusKeywordsJson: focusKeywords,
      closedAt: finalSessionStatus === 'closed' ? new Date() : undefined,
      updatedAt: new Date(),
    })

    await this.aiChatRepository.updateUseKey({
      id: bundle.useKey.id,
      usedTurns: nextTurnCount,
      updatedAt: new Date(),
    })

    const refreshedSession = await this.getPublicSessionSnapshot(bundle.session.id, input.useKey)

    return {
      remainingTurns: Math.max(0, bundle.useKey.maxTurns - nextTurnCount),
      session: refreshedSession,
      summary: generatedSummary,
      userMessage: this.mapMessage(userMessageRecord),
      assistantMessage: this.mapMessage(assistantMessageRecord),
    }
  }

  async listLeads() {
    const records = await this.aiChatRepository.listLeads()
    return records.map((item) => mapLead(item))
  }

  async listUseKeys() {
    const records = await this.aiChatRepository.listUseKeys()
    return records.map((item) => mapUseKey(item))
  }

  async listSessions(): Promise<AiChatSessionListItem[]> {
    const bundles = await this.aiChatRepository.listSessionBundles()
    return bundles.map((item) => ({
      id: item.session.id,
      leadDisplayName: item.lead.displayName,
      companyName: item.lead.companyName ?? '',
      status: item.session.status as AiChatSessionListItem['status'],
      turnCount: item.session.turnCount,
      locale: item.session.locale as AiChatLocale,
      updatedAt: item.session.updatedAt.toISOString(),
      createdAt: item.session.createdAt.toISOString(),
      hasFinalSummary: Boolean(item.session.finalSummary),
    }))
  }

  async getAdminSessionSnapshot(sessionId: string) {
    const bundle = await this.requireSessionBundle(sessionId)
    return this.buildSessionSnapshot(bundle)
  }

  private async requireSessionBundle(sessionId: string) {
    const bundle = await this.aiChatRepository.getSessionBundle(sessionId)

    if (!bundle) {
      throw new NotFoundException('AI chat session not found')
    }

    return bundle
  }

  private async ensurePublicDailyQuotaCurrent(
    bundle: AiChatSessionBundle,
  ): Promise<AiChatSessionBundle> {
    const now = new Date()

    if (
      !isPublicChatBundle(bundle) ||
      bundle.useKey.status === 'revoked' ||
      bundle.useKey.status === 'expired' ||
      isSameLocalDate(bundle.session.updatedAt, now)
    ) {
      return bundle
    }

    await this.aiChatRepository.resetSessionTurns({
      sessionId: bundle.session.id,
      useKeyId: bundle.useKey.id,
      now,
    })

    const refreshedBundle = await this.aiChatRepository.getSessionBundle(bundle.session.id)

    if (!refreshedBundle) {
      throw new NotFoundException('AI chat session not found')
    }

    return refreshedBundle
  }

  private async buildSessionSnapshot(bundle: AiChatSessionBundle): Promise<AiChatSessionSnapshot> {
    const messages = await this.aiChatRepository.listMessagesBySessionId(bundle.session.id)
    const totalUserTurns = messages.filter((item) => item.role === 'user').length
    const interimSummary = bundle.session.interimSummary
      ? {
          generatedAt: bundle.session.updatedAt.toISOString(),
          keywords: [],
          stage: 'turn-10' as const,
          summary: bundle.session.interimSummary,
        }
      : null
    const finalSummary = bundle.session.finalSummary
      ? {
          generatedAt: bundle.session.closedAt?.toISOString() ?? bundle.session.updatedAt.toISOString(),
          keywords: (bundle.session.focusKeywordsJson as string[] | null) ?? [],
          stage: 'turn-20' as const,
          summary: bundle.session.finalSummary,
        }
      : null

    return {
      sessionId: bundle.session.id,
      lead: mapLead(bundle.lead),
      locale: bundle.session.locale as AiChatLocale,
      status: bundle.session.status as AiChatSessionSnapshot['status'],
      quotaDate: buildLocalDateKey(new Date()),
      maxDailyTurns: bundle.useKey.maxTurns,
      turnCount: bundle.session.turnCount,
      remainingTurns: Math.max(0, bundle.useKey.maxTurns - bundle.session.turnCount),
      totalUserTurns,
      useKeyStatus: bundle.useKey.status as AiChatSessionSnapshot['useKeyStatus'],
      messages: messages.map((item) => this.mapMessage(item)),
      interimSummary,
      finalSummary,
      createdAt: bundle.session.createdAt.toISOString(),
      updatedAt: bundle.session.updatedAt.toISOString(),
      closedAt: bundle.session.closedAt?.toISOString() ?? null,
    }
  }

  private mapMessage(record: {
    answerBlocksJson: unknown | null
    citationsJson: unknown | null
    content: string
    createdAt: Date
    id: string
    role: string
    turnIndex: number
  }): AiChatMessageSnapshot {
    return {
      id: record.id,
      role: record.role as AiChatMessageSnapshot['role'],
      content: record.content,
      turnIndex: record.turnIndex,
      answerBlocks: Array.isArray(record.answerBlocksJson)
        ? (record.answerBlocksJson as AiChatMessageBlock[])
        : [],
      citations: Array.isArray(record.citationsJson)
        ? (record.citationsJson as RagAskCitation[])
        : [],
      createdAt: record.createdAt.toISOString(),
    }
  }

  private async generateAnswerWithGraph(
    input: {
      locale: AiChatLocale
      question: string
      onToken?: (token: string) => void
    },
  ): Promise<AiChatAnswerGenerationResult> {
    try {
      return await this.aiChatGraphService.generateAnswer(input)
    } catch (error) {
      this.logger.warn({
        event: 'ai-chat.graph.service_fallback',
        message: error instanceof Error ? error.message : String(error),
        question: input.question,
      })

      return this.generateAnswer(input)
    }
  }

  private async generateAnswer(
    input: {
      locale: AiChatLocale
      question: string
      onToken?: (token: string) => void
    },
  ): Promise<AiChatAnswerGenerationResult> {
    const startedAt = Date.now()
    const classification = classifyQuestion(input.question)

    if (classification !== 'normal') {
      this.logger.log({
        event: 'ai-chat.generateAnswer.routed',
        classification,
        question: input.question,
        durationMs: Date.now() - startedAt,
      })
    }

    if (classification === 'greeting') {
      return buildGreetingAnswer(input.locale)
    }

    if (classification === 'negative') {
      return buildNegativeAnswer(input.locale)
    }

    if (classification === 'short') {
      const shortAnswer = buildShortAnswer(input.question, input.locale)
      if (shortAnswer.answer) return shortAnswer
    }

    // 获取已发布简历的结构化摘要
    const snapshot = await this.resumePublicationService.getPublished()
    const resumeSummary = snapshot?.resume
      ? buildResumeSummary(snapshot.resume, input.locale)
      : ''

    // RAG 检索
    const ragResult = await this.ragService.ask(
      input.question,
      DEFAULT_CHAT_LIMIT,
      input.locale,
      { vectorScope: 'published' },
      input.onToken ? { onToken: input.onToken } : undefined,
    )

    // 无有效匹配 + 无简历摘要 → 低相关度模板
    if (ragResult.citations.length === 0 && !resumeSummary) {
      this.logger.log({
        event: 'ai-chat.generateAnswer.low_relevance',
        question: input.question,
        matchCount: ragResult.matches.length,
        hasResumeSummary: false,
        durationMs: Date.now() - startedAt,
      })
      const topScore = ragResult.matches[0]?.score ?? 0
      return buildLowRelevanceAnswer(input.question, topScore, input.locale)
    }

    // 构建 card blocks：简历卡片 + 自定义内容卡片
    const resumeBlocks = snapshot?.resume
      ? this.buildAnswerBlocksFromResume(snapshot.resume, ragResult.citations, input.locale)
      : []
    const customBlocks = this.buildCustomBlocksFromCitations(ragResult.citations)
    const cardBlocks = [...resumeBlocks, ...customBlocks].slice(0, 4)

    // 有 RAG 结果 → LLM 基于上下文 + 简历摘要回答
    if (ragResult.answer && ragResult.citations.length > 0) {
      this.logger.log({
        event: 'ai-chat.generateAnswer.rag_answered',
        question: input.question,
        citationCount: ragResult.citations.length,
        hasResumeSummary: Boolean(resumeSummary),
        durationMs: Date.now() - startedAt,
      })
      return {
        answer: ragResult.answer,
        citations: ragResult.citations,
        blocks: cardBlocks,
      }
    }

    // 无 RAG 但简历存在 → 用简历摘要作为上下文调 LLM
    this.logger.log({
      event: 'ai-chat.generateAnswer.resume_fallback',
      question: input.question,
      hasResumeSummary: Boolean(resumeSummary),
      durationMs: Date.now() - startedAt,
    })
    const systemPrompt = buildRagAskSystemPrompt(input.locale)
    const prompt = input.locale === 'en'
      ? [`Question: ${input.question}`, 'Resume summary:', resumeSummary, 'Answer based on the resume summary above. Keep it concise and natural.'].join('\n\n')
      : [`问题：${input.question}`, '简历摘要：', resumeSummary, '请根据以上简历摘要，用自然的第一人称回答。简洁真诚，不确定的地方可以诚实说明。'].join('\n\n')

    const result = input.onToken
      ? await this.aiService.generateTextStream({ systemPrompt, prompt, onToken: input.onToken })
      : await this.aiService.generateText({ systemPrompt, prompt })

    return {
      answer: result.text,
      citations: [],
      blocks: cardBlocks,
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

  /**
   * 根据 RAG 引用的 contentType 构建自定义卡片（文章/媒体/兴趣爱好）。
   *
   * 当引用来自 user_docs 且 metadata 标注了 contentType 时，
   * 生成对应类型的卡片 block，在前端按不同视觉样式渲染。
   */
  private buildCustomBlocksFromCitations(
    citations: RagAskCitation[],
  ): AiChatMessageBlock[] {
    const blocks: AiChatMessageBlock[] = []
    const seen = new Set<string>()

    for (const citation of citations) {
      if (citation.sourceType !== 'user_docs') continue
      const ct = (citation as any)?.contentType as string | undefined
      if (!ct || seen.has(`${ct}:${citation.title}`)) continue
      seen.add(`${ct}:${citation.title}`)

      if (ct === 'article' || ct === 'tech_blog' || ct === 'knowledge_column' || ct === 'general' || ct === 'media') {
        blocks.push({
          type: 'article_card',
          title: citation.title,
          summary: resolveCustomCardSummary(citation),
          category: normalizeArticleCardCategory(ct),
          url: citation.richCard?.url,
          imageUrl: citation.richCard?.imageUrl,
          publishedAt: citation.richCard?.publishedAt,
          keywords: citation.richCard?.keywords ?? citation.tags ?? [],
          media: buildCustomCardMedia(citation),
        })
      } else if (ct === 'hobby') {
        blocks.push({
          type: 'hobby_card',
          title: citation.title,
          description: resolveCustomCardSummary(citation),
          category: 'hobby',
          url: citation.richCard?.url,
          imageUrl: citation.richCard?.imageUrl,
          keywords: citation.richCard?.keywords ?? citation.tags ?? [],
          media: buildCustomCardMedia(citation),
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

  private async generateConversationSummary(input: {
    locale: AiChatLocale
    sessionId: string
    stage: string
  }): Promise<AiChatSummarySnapshot> {
    const messages = await this.aiChatRepository.listMessagesBySessionId(input.sessionId)
    const prompt = buildAiChatSummaryPrompt({
      locale: input.locale,
      stage: input.stage,
      messages: messages.map((item) => ({
        role: item.role as 'assistant' | 'system' | 'user',
        content: item.content,
        turnIndex: item.turnIndex,
      })),
    })
    const providerSummary = this.aiService.getProviderSummary()

    try {
      const result = await this.aiService.generateStructuredObject({
        method: chooseStructuredMethod(providerSummary),
        prompt,
        schema: AI_CHAT_SUMMARY_SCHEMA,
        schemaDescription: 'Summarize recruiter chat session into summary and keywords.',
        schemaName: 'AiChatSummaryPayload',
        systemPrompt: AI_CHAT_SUMMARY_SYSTEM_PROMPT[input.locale],
        temperature: 0,
      })
      const parsed = AI_CHAT_SUMMARY_SCHEMA.safeParse(result.value)

      if (parsed.success) {
        return {
          generatedAt: new Date().toISOString(),
          keywords: parsed.data.keywords,
          stage: input.stage,
          summary: `${parsed.data.visitorFocus}\n\n${parsed.data.aiClosing}`,
          visitorFocus: parsed.data.visitorFocus,
          aiClosing: parsed.data.aiClosing,
        }
      }

      // Zod 校验失败时尝试宽松修复：截断 keywords、补全缺失字段
      const raw = result.value as Record<string, unknown>
      const keywords = Array.isArray(raw.keywords) ? (raw.keywords as string[]).slice(0, 15) : []
      const visitorFocus = typeof raw.visitorFocus === 'string' && raw.visitorFocus ? raw.visitorFocus : ''
      const aiClosing = typeof raw.aiClosing === 'string' && raw.aiClosing ? raw.aiClosing : ''
      const summary = visitorFocus && aiClosing ? `${visitorFocus}\n\n${aiClosing}` : String(raw.summary ?? '')

      if (summary) {
        return {
          generatedAt: new Date().toISOString(),
          keywords,
          stage: input.stage,
          summary,
          visitorFocus: visitorFocus || undefined,
          aiClosing: aiClosing || undefined,
        }
      }

      throw new Error(`Summary payload missing required fields: ${parsed.error.message}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.logger.warn(`ai chat summary fallback: ${message}`)

      const userMessages = messages
        .filter((item) => item.role === 'user')
        .map((item) => item.content.trim())
        .filter(Boolean)
      const summary = userMessages.slice(-3).join('；').slice(0, 240)

      return {
        generatedAt: new Date().toISOString(),
        keywords: userMessages.flatMap((item) => item.split(/[，,、\s]+/)).filter(Boolean).slice(0, 5),
        stage: input.stage,
        summary:
          summary ||
          (input.locale === 'en'
            ? 'The conversation focused on resume-relevant questions.'
            : '本次会话主要围绕候选人的简历相关问题展开。'),
      }
    }
  }

  buildStreamTextChunks(answer: string) {
    return chunkAnswerText(answer)
  }
}
