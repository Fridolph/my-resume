import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AiChatController } from '../../transport/controllers/ai-chat.controller'

function createMockResponse() {
  const writes: string[] = []

  return {
    response: {
      end: vi.fn(),
      flushHeaders: vi.fn(),
      setHeader: vi.fn(),
      write: vi.fn((chunk: string) => {
        writes.push(chunk)
      }),
    },
    writes,
  }
}

describe('AiChatController', () => {
  const aiChatService = {
    adminClearMessages: vi.fn(),
    adminDeleteUseKey: vi.fn(),
    adminResetSession: vi.fn(),
    claimPublicSession: vi.fn(),
    claimUseKey: vi.fn(),
    closeSession: vi.fn(),
    createAssistantReply: vi.fn(),
    getAdminSessionSnapshot: vi.fn(),
    getPublicSessionSnapshot: vi.fn(),
    issueUseKey: vi.fn(),
    listLeads: vi.fn(),
    listSessions: vi.fn(),
    listUseKeys: vi.fn(),
    revokeUseKey: vi.fn(),
    submitLead: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('streams SSE events in start -> token -> citation -> block -> summary -> done order', async () => {
    const controller = new AiChatController(aiChatService as never)
    const { response, writes } = createMockResponse()

    vi.mocked(aiChatService.createAssistantReply).mockImplementationOnce(
      async (_input, callbacks) => {
        callbacks?.onStart?.({
          assistantMessageId: 'assistant-001',
          remainingTurns: 19,
          sessionId: 'session-001',
          turnCount: 1,
        })
        callbacks?.onToken?.('你好')
        callbacks?.onCitation?.({
          ref: '#1',
          title: 'EDR',
          snippet: '终端威胁侦测平台',
          section: 'project',
        })
        callbacks?.onBlock?.({
          type: 'project_card',
          title: 'EDR',
          subtitle: '负责人',
          period: '2024-01 - 2024-12',
          summary: '负责 AI 对话链路整合',
          technologies: ['RAG'],
          highlights: ['接入 SSE 流式回答'],
        })

        return {
          remainingTurns: 19,
          summary: {
            generatedAt: '2026-05-12T00:00:01.000Z',
            keywords: ['RAG'],
            stage: 'turn-10',
            summary: '阶段总结',
          },
          session: {
            sessionId: 'session-001',
            locale: 'zh',
            status: 'open',
            turnCount: 1,
            remainingTurns: 19,
            useKeyStatus: 'claimed',
            lead: {
              id: 'lead-001',
              locale: 'zh',
              displayName: '公开站访客',
              companyName: '',
              contact: '',
              message: '',
              status: 'issued',
              createdAt: '2026-05-12T00:00:00.000Z',
              updatedAt: '2026-05-12T00:00:00.000Z',
            },
            messages: [],
            interimSummary: null,
            finalSummary: null,
            createdAt: '2026-05-12T00:00:00.000Z',
            updatedAt: '2026-05-12T00:00:01.000Z',
            closedAt: null,
          },
          userMessage: {
            id: 'user-001',
            role: 'user',
            content: '你好',
            turnIndex: 1,
            answerBlocks: [],
            citations: [],
            createdAt: '2026-05-12T00:00:00.000Z',
          },
          assistantMessage: {
            id: 'assistant-001',
            role: 'assistant',
            content: '你好',
            turnIndex: 1,
            answerBlocks: [],
            citations: [],
            createdAt: '2026-05-12T00:00:01.000Z',
          },
        }
      },
    )

    await controller.streamMessage(
      'session-001',
      { content: '你好', locale: 'zh', useKey: 'FY-1A2B3C4D' },
      response as never,
    )

    const output = writes.join('')

    expect(response.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'text/event-stream; charset=utf-8',
    )
    expect(response.setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      'no-cache, no-transform',
    )
    expect(output.indexOf('event: start')).toBeLessThan(output.indexOf('event: token'))
    expect(output.indexOf('event: token')).toBeLessThan(output.indexOf('event: citation'))
    expect(output.indexOf('event: citation')).toBeLessThan(output.indexOf('event: block'))
    expect(output.indexOf('event: block')).toBeLessThan(output.indexOf('event: summary'))
    expect(output.indexOf('event: summary')).toBeLessThan(output.indexOf('event: done'))
    expect(output).toContain('"assistantMessageId":"assistant-001"')
    expect(output).toContain('"ref":"#1"')
    expect(output).toContain('"type":"project_card"')
    expect(output).toContain('"stage":"turn-10"')
    expect(response.end).toHaveBeenCalledTimes(1)
  })

  it('writes an SSE error event when the stream creation fails', async () => {
    const controller = new AiChatController(aiChatService as never)
    const { response, writes } = createMockResponse()

    vi.mocked(aiChatService.createAssistantReply).mockRejectedValueOnce(
      new Error('stream boom'),
    )

    await controller.streamMessage(
      'session-001',
      { content: '你好', locale: 'zh', useKey: 'FY-1A2B3C4D' },
      response as never,
    )

    expect(writes.join('')).toContain('event: error')
    expect(writes.join('')).toContain('"message":"stream boom"')
    expect(response.end).toHaveBeenCalledTimes(1)
  })
})
