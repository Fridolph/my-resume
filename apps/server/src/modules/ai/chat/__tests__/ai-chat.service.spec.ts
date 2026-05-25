import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AiChatRepository } from '../ai-chat.repository'
import { AiChatService } from '../ai-chat.service'
import { AiService } from '../../application/services/ai.service'
import { RagService } from '../../rag/rag.service'
import { ResumePublicationService } from '../../../resume/application/services/resume-publication.service'

function createSessionSnapshot(overrides: Partial<Awaited<ReturnType<AiChatService['getPublicSessionSnapshot']>>> = {}) {
  return {
    sessionId: 'session-001',
    locale: 'zh' as const,
    status: 'open' as const,
    turnCount: 0,
    remainingTurns: 20,
    useKeyStatus: 'claimed' as const,
    lead: {
      id: 'lead-001',
      locale: 'zh' as const,
      displayName: '公开站访客',
      companyName: '',
      contact: '',
      message: '访客已同意公开站 AI 对话提示，系统自动创建当日会话。',
      status: 'issued' as const,
      createdAt: '2026-05-12T00:00:00.000Z',
      updatedAt: '2026-05-12T00:00:00.000Z',
    },
    messages: [],
    interimSummary: null,
    finalSummary: null,
    createdAt: '2026-05-12T00:00:00.000Z',
    updatedAt: '2026-05-12T00:00:00.000Z',
    closedAt: null,
    ...overrides,
  }
}

function createSessionBundle(overrides?: {
  session?: Partial<{
    id: string
    leadId: string
    useKeyId: string
    locale: string
    status: string
    turnCount: number
    interimSummary: string | null
    finalSummary: string | null
    focusKeywordsJson: string[] | null
    closedAt: Date | null
    createdAt: Date
    updatedAt: Date
  }>
  useKey?: Partial<{
    id: string
    useKey: string
    leadId: string
    sessionId: string | null
    status: string
    maxTurns: number
    usedTurns: number
    claimedAt: Date | null
    revokedAt: Date | null
    expiresAt: Date | null
    createdAt: Date
    updatedAt: Date
  }>
  lead?: Partial<{
    id: string
    locale: string
    displayName: string
    companyName: string | null
    contact: string | null
    message: string
    status: string
    createdAt: Date
    updatedAt: Date
  }>
}) {
  return {
    lead: {
      id: 'lead-001',
      locale: 'zh',
      displayName: '公开站访客',
      companyName: null,
      contact: null,
      message: '访客已同意公开站 AI 对话提示，系统自动创建当日会话。',
      status: 'issued',
      createdAt: new Date('2026-05-12T00:00:00.000Z'),
      updatedAt: new Date('2026-05-12T00:00:00.000Z'),
      ...overrides?.lead,
    },
    session: {
      id: 'session-001',
      leadId: 'lead-001',
      useKeyId: 'usekey-001',
      locale: 'zh',
      status: 'open',
      turnCount: 0,
      interimSummary: null,
      finalSummary: null,
      focusKeywordsJson: null,
      closedAt: null,
      createdAt: new Date('2026-05-12T00:00:00.000Z'),
      updatedAt: new Date('2026-05-12T00:00:00.000Z'),
      ...overrides?.session,
    },
    useKey: {
      id: 'usekey-001',
      useKey: 'FY-1A2B3C4D',
      leadId: 'lead-001',
      sessionId: 'session-001',
      status: 'claimed',
      maxTurns: 20,
      usedTurns: 0,
      claimedAt: new Date('2026-05-12T00:00:00.000Z'),
      revokedAt: null,
      expiresAt: null,
      createdAt: new Date('2026-05-12T00:00:00.000Z'),
      updatedAt: new Date('2026-05-12T00:00:00.000Z'),
      ...overrides?.useKey,
    },
  }
}

function createRepositoryMock() {
  return {
    createLead: vi.fn(),
    createMessage: vi.fn(),
    createSession: vi.fn(),
    createUseKey: vi.fn(),
    deleteMessagesBySessionId: vi.fn(),
    deleteUseKey: vi.fn(),
    expireOverdueUseKeys: vi.fn(),
    findLatestLeadBySourceKey: vi.fn(),
    findLatestUseKeyByLeadId: vi.fn(),
    findLeadById: vi.fn(),
    findLeadByUseKey: vi.fn(),
    findUseKeyByValue: vi.fn(),
    getSessionBundle: vi.fn(),
    listLeads: vi.fn(),
    listMessagesBySessionId: vi.fn(),
    listSessionBundles: vi.fn(),
    listUseKeys: vi.fn(),
    resetSessionTurns: vi.fn(),
    updateLeadStatus: vi.fn(),
    updateSession: vi.fn(),
    updateUseKey: vi.fn(),
  } as unknown as AiChatRepository & Record<string, ReturnType<typeof vi.fn>>
}

function createService(repository = createRepositoryMock()) {
  const aiService = {
    generateStructuredObject: vi.fn(),
    generateText: vi.fn(),
    generateTextStream: vi.fn(),
    getProviderSummary: vi.fn().mockReturnValue({
      provider: 'mock',
      model: 'mock-chat',
      mode: 'mock',
    }),
  } as unknown as AiService
  const ragService = {
    ask: vi.fn(),
  } as unknown as RagService
  const resumePublicationService = {
    getPublished: vi.fn(),
  } as unknown as ResumePublicationService

  return {
    aiService,
    ragService,
    repository,
    resumePublicationService,
    service: new AiChatService(
      repository as never,
      aiService as never,
      ragService as never,
      resumePublicationService as never,
    ),
  }
}

describe('AiChatService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a session when a claimed useKey has not been bound yet', async () => {
    const repository = createRepositoryMock()
    const { service } = createService(repository)
    const snapshot = createSessionSnapshot()

    repository.findLeadByUseKey.mockResolvedValue({
      lead: createSessionBundle().lead,
      useKey: {
        ...createSessionBundle().useKey,
        sessionId: null,
        status: 'issued',
      },
    })
    repository.createSession.mockResolvedValue({
      id: 'session-001',
    })
    repository.updateUseKey.mockResolvedValue({
      id: 'usekey-001',
    })
    vi.spyOn(service, 'getPublicSessionSnapshot').mockResolvedValue(snapshot)

    const result = await service.claimUseKey({
      locale: 'zh',
      useKey: 'FY-1A2B3C4D',
    })

    expect(repository.createSession).toHaveBeenCalled()
    expect(repository.updateUseKey).toHaveBeenCalledWith(
      expect.objectContaining({
        claimedAt: expect.any(Date),
        sessionId: 'session-001',
        status: 'claimed',
      }),
    )
    expect(result).toEqual(snapshot)
  })

  it('restores persisted messages and summaries for public session snapshots', async () => {
    const repository = createRepositoryMock()
    const { service } = createService(repository)

    repository.getSessionBundle.mockResolvedValue(
      createSessionBundle({
        session: {
          turnCount: 12,
          interimSummary: '阶段总结',
          finalSummary: null,
        },
      }),
    )
    repository.listMessagesBySessionId.mockResolvedValue([
      {
        id: 'user-001',
        role: 'user',
        content: '介绍一下你的项目经历',
        turnIndex: 12,
        answerBlocksJson: null,
        citationsJson: null,
        createdAt: new Date('2026-05-12T00:00:00.000Z'),
      },
      {
        id: 'assistant-001',
        role: 'assistant',
        content: '我最近主要在做公开简历与 AI 对话相关的工程整合。',
        turnIndex: 12,
        answerBlocksJson: [],
        citationsJson: [],
        createdAt: new Date('2026-05-12T00:00:01.000Z'),
      },
    ])

    const snapshot = await service.getPublicSessionSnapshot('session-001', 'FY-1A2B3C4D')

    expect(snapshot.turnCount).toBe(12)
    expect(snapshot.remainingTurns).toBe(8)
    expect(snapshot.messages).toHaveLength(2)
    expect(snapshot.interimSummary?.summary).toBe('阶段总结')
  })

  it('persists user, assistant, and summary messages when turn 10 triggers interim summarization', async () => {
    const repository = createRepositoryMock()
    const { service } = createService(repository)

    repository.getSessionBundle.mockResolvedValue(
      createSessionBundle({
        session: {
          turnCount: 9,
        },
        useKey: {
          usedTurns: 9,
        },
      }),
    )
    repository.createMessage.mockImplementation(async (input) => ({
      ...input,
      answerBlocksJson: input.answerBlocksJson ?? null,
      citationsJson: input.citationsJson ?? null,
    }))
    repository.updateSession.mockResolvedValue(undefined)
    repository.updateUseKey.mockResolvedValue(undefined)

    vi.spyOn(service as never, 'generateAnswer').mockResolvedValue({
      answer: '这里是基于简历的回答',
      blocks: [
        {
          type: 'project_card',
          title: 'EDR',
          subtitle: '负责人',
          period: '2024-01 - 2024-12',
          summary: '负责 AI 对话整合',
          technologies: ['RAG'],
          highlights: ['接入 SSE'],
        },
      ],
      citations: [
        {
          ref: '#1',
          title: 'EDR',
          snippet: '终端威胁侦测平台',
          section: 'project',
        },
      ],
    })
    vi.spyOn(service as never, 'generateConversationSummary').mockResolvedValue({
      generatedAt: '2026-05-12T00:00:02.000Z',
      keywords: ['RAG', 'SSE'],
      stage: 'turn-10',
      summary: '阶段总结',
    })
    vi.spyOn(service, 'getPublicSessionSnapshot').mockResolvedValue(
      createSessionSnapshot({
        remainingTurns: 10,
        turnCount: 10,
        interimSummary: {
          generatedAt: '2026-05-12T00:00:02.000Z',
          keywords: ['RAG', 'SSE'],
          stage: 'turn-10',
          summary: '阶段总结',
        },
      }),
    )

    const onStart = vi.fn()
    const onCitation = vi.fn()
    const onBlock = vi.fn()

    const result = await service.createAssistantReply(
      {
        sessionId: 'session-001',
        useKey: 'FY-1A2B3C4D',
        content: '介绍一下你的项目经历',
      },
      {
        onStart,
        onCitation,
        onBlock,
      },
    )

    expect(onStart).toHaveBeenCalledWith(
      expect.objectContaining({
        remainingTurns: 10,
        turnCount: 10,
      }),
    )
    expect(onCitation).toHaveBeenCalledWith(
      expect.objectContaining({
        ref: '#1',
      }),
    )
    expect(onBlock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'project_card',
      }),
    )
    expect(repository.createMessage).toHaveBeenCalledTimes(3)
    expect(repository.updateSession).toHaveBeenCalledWith(
      expect.objectContaining({
        finalSummary: null,
        interimSummary: '阶段总结',
        status: 'open',
        turnCount: 10,
      }),
    )
    expect(repository.updateUseKey).toHaveBeenCalledWith(
      expect.objectContaining({
        usedTurns: 10,
      }),
    )
    expect(result.summary?.stage).toBe('turn-10')
  })

  it('closes the session and stores the final summary when turn 20 is reached', async () => {
    const repository = createRepositoryMock()
    const { service } = createService(repository)

    repository.getSessionBundle.mockResolvedValue(
      createSessionBundle({
        session: {
          turnCount: 19,
        },
        useKey: {
          usedTurns: 19,
        },
      }),
    )
    repository.createMessage.mockImplementation(async (input) => ({
      ...input,
      answerBlocksJson: input.answerBlocksJson ?? null,
      citationsJson: input.citationsJson ?? null,
    }))
    repository.updateSession.mockResolvedValue(undefined)
    repository.updateUseKey.mockResolvedValue(undefined)

    vi.spyOn(service as never, 'generateAnswer').mockResolvedValue({
      answer: '这是本次会话的最后一条回答',
      blocks: [],
      citations: [],
    })
    vi.spyOn(service as never, 'generateConversationSummary').mockResolvedValue({
      generatedAt: '2026-05-12T00:00:02.000Z',
      keywords: ['RAG', '项目经历'],
      stage: 'turn-20',
      summary: '最终总结',
    })
    vi.spyOn(service, 'getPublicSessionSnapshot').mockResolvedValue(
      createSessionSnapshot({
        finalSummary: {
          generatedAt: '2026-05-12T00:00:02.000Z',
          keywords: ['RAG', '项目经历'],
          stage: 'turn-20',
          summary: '最终总结',
        },
        remainingTurns: 0,
        status: 'closed',
        turnCount: 20,
      }),
    )

    const result = await service.createAssistantReply({
      sessionId: 'session-001',
      useKey: 'FY-1A2B3C4D',
      content: '最后总结一下我适合什么方向',
    })

    expect(repository.updateSession).toHaveBeenCalledWith(
      expect.objectContaining({
        finalSummary: '最终总结',
        focusKeywordsJson: ['RAG', '项目经历'],
        status: 'closed',
        turnCount: 20,
      }),
    )
    expect(repository.updateUseKey).toHaveBeenCalledWith(
      expect.objectContaining({
        usedTurns: 20,
      }),
    )
    expect(result.session.status).toBe('closed')
    expect(result.summary?.stage).toBe('turn-20')
  })
})
