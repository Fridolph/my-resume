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
const DEFAULT_CHAT_LIMIT = 4
const PUBLIC_CHAT_POLICY_VERSION = 'm23-public-ip-v1'
const PUBLIC_CHAT_SOURCE_TAG = 'public-ip'
const PUBLIC_CHAT_ISSUER = 'system-public-chat'
const AI_CHAT_SUMMARY_SCHEMA = z.object({
  summary: z.string(),
  keywords: z.array(z.string()).max(8),
})

function readLocalizedText(value: LocalizedText, locale: AiChatLocale): string {
  return (locale === 'en' ? value.en : value.zh || value.en || value.zh).trim()
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

  if (trimmed === '::1') {
    return '127.0.0.1'
  }

  if (trimmed.startsWith('::ffff:')) {
    return trimmed.slice('::ffff:'.length)
  }

  return trimmed
}

function buildLocalDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function buildPublicLeadSourceKey(ipAddress: string, date = new Date()) {
  const ipHash = createHash('sha256').update(ipAddress).digest('hex').slice(0, 16)
  return `${PUBLIC_CHAT_SOURCE_TAG}:${buildLocalDateKey(date)}:${ipHash}`
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
  const text =
    locale === 'en'
      ? "I can only answer questions about my background, projects, work experience, technical skills, and related interests. Feel free to ask about those!"
      : '我只能回答关于我的背景、项目经历、工作经历、技术技能和相关兴趣的问题。欢迎问我这些方面！'

  return {
    answer: text,
    blocks: [
      {
        type: 'system_notice',
        tone: 'warning',
        text,
      },
    ],
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
    const sourceKey = buildPublicLeadSourceKey(normalizedIp, now)
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

    const useKeyRecord =
      (await this.aiChatRepository.findLatestUseKeyByLeadId(lead.id)) ??
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
    const bundle = await this.requireSessionBundle(sessionId)

    if (bundle.useKey.useKey !== useKeyValue) {
      throw new ForbiddenException('当前会话与 useKey 不匹配')
    }

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
    const bundle = await this.requireSessionBundle(sessionId)

    await this.aiChatRepository.deleteMessagesBySessionId(sessionId)

    return this.getAdminSessionSnapshot(sessionId)
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
    const bundle = await this.requireSessionBundle(input.sessionId)

    if (bundle.useKey.useKey !== input.useKey) {
      throw new ForbiddenException('当前会话与 useKey 不匹配')
    }

    if (bundle.useKey.status === 'revoked' || bundle.useKey.status === 'expired') {
      throw new ForbiddenException('当前 useKey 不可继续使用')
    }

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

    const answerResult = await this.generateAnswer({
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

    if (nextTurnCount === SUMMARY_TRIGGER_TURN || nextTurnCount === MAX_CHAT_TURNS) {
      generatedSummary = await this.generateConversationSummary({
        locale,
        sessionId: bundle.session.id,
        stage: nextTurnCount === MAX_CHAT_TURNS ? 'turn-20' : 'turn-10',
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
            title: generatedSummary.stage === 'turn-20' ? '会话总结' : '阶段总结',
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

  private async buildSessionSnapshot(bundle: Awaited<ReturnType<AiChatRepository['getSessionBundle']>> extends infer T ? NonNullable<T> : never): Promise<AiChatSessionSnapshot> {
    const messages = await this.aiChatRepository.listMessagesBySessionId(bundle.session.id)
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

    // 第10轮后压缩：前10轮对话替换为一条系统摘要消息，节省上下文
    const mappedMessages = messages.map((item) => this.mapMessage(item))
    const compressedMessages = interimSummary
      ? [
          {
            id: `summary-turn-10`,
            role: 'assistant' as const,
            content: `会话中期总结：${interimSummary.summary}`,
            turnIndex: 0,
            answerBlocks: [],
            citations: [],
            createdAt: interimSummary.generatedAt,
          },
          ...mappedMessages.filter((msg) => msg.turnIndex > 10),
        ]
      : mappedMessages

    return {
      sessionId: bundle.session.id,
      lead: mapLead(bundle.lead),
      locale: bundle.session.locale as AiChatLocale,
      status: bundle.session.status as AiChatSessionSnapshot['status'],
      turnCount: bundle.session.turnCount,
      remainingTurns: Math.max(0, bundle.useKey.maxTurns - bundle.session.turnCount),
      useKeyStatus: bundle.useKey.status as AiChatSessionSnapshot['useKeyStatus'],
      messages: compressedMessages,
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

  private async generateAnswer(
    input: {
      locale: AiChatLocale
      question: string
      onToken?: (token: string) => void
    },
  ): Promise<AiChatAnswerGenerationResult> {
    const ragResult = await this.ragService.ask(
      input.question,
      DEFAULT_CHAT_LIMIT,
      input.locale,
      { vectorScope: 'published' },
      input.onToken ? { onToken: input.onToken } : undefined,
    )

    if (ragResult.citations.length === 0) {
      return buildIrrelevantAnswer(input.locale)
    }

    const snapshot = await this.resumePublicationService.getPublished()
    const cardBlocks = snapshot
      ? this.buildAnswerBlocksFromResume(snapshot.resume, ragResult.citations, input.locale)
      : []

    return {
      answer: ragResult.answer,
      citations: ragResult.citations,
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
    stage: 'turn-10' | 'turn-20'
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
      const payload = AI_CHAT_SUMMARY_SCHEMA.parse(result.value)

      return {
        generatedAt: new Date().toISOString(),
        keywords: payload.keywords,
        stage: input.stage,
        summary: payload.summary,
      }
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
