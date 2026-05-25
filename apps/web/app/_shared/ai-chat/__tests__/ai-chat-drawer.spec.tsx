import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const useAiChatMock = vi.fn()

vi.mock('../ai-chat-context', () => ({
  useAiChat: () => useAiChatMock(),
}))

import { AiChatDrawer } from '../ai-chat-drawer'

describe('AiChatDrawer', () => {
  it('should render loading shell with close and minimize actions', () => {
    useAiChatMock.mockReturnValue({
      acceptConsent: vi.fn(),
      canRetryLastMessage: false,
      cancelStreaming: vi.fn(),
      clearPresentation: vi.fn(),
      closeSession: vi.fn(),
      draftAssistantMessage: null,
      drawerState: 'open',
      dismissConsentModal: vi.fn(),
      errorMessage: null,
      hasConsentForToday: true,
      hideDrawer: vi.fn(),
      isBootstrappingSession: false,
      isConsentModalOpen: false,
      isDrawerOpen: true,
      isDrawerVisible: true,
      isStreaming: false,
      minimizeDrawer: vi.fn(),
      openDrawer: vi.fn(),
      presentation: {
        assistantAvatarSrc: '/img/avatar.jpg',
        assistantLabel: '付寅生',
        visitorLabel: '访客',
      },
      refreshSession: vi.fn(),
      registerPresentation: vi.fn(),
      restoreDrawer: vi.fn(),
      restoreReady: true,
      retryLastMessage: vi.fn(),
      sendMessage: vi.fn(),
      session: null,
      summaryPreview: null,
      useKeyStatus: null,
      view: 'loading',
    })

    render(<AiChatDrawer locale="zh" />)

    expect(screen.getAllByRole('heading', { name: 'AI 对话' }).length).toBeGreaterThan(0)
    expect(
      screen.getByText('Resume Companion · 仅限简历相关 · 正在准备会话'),
    ).toBeInTheDocument()
    expect(screen.getAllByText('启动中').length).toBeGreaterThan(0)
    expect(screen.getByText('正在启动 AI 对话...')).toBeInTheDocument()
    expect(screen.getByLabelText('关闭 AI 对话')).toBeInTheDocument()
    expect(screen.getByLabelText('最小化 AI 对话')).toBeInTheDocument()
    expect(document.querySelector('[data-slot="drawer-backdrop"]')?.className).toContain(
      'drawer__backdrop--transparent',
    )
  })

  it('should render mainstream chat layout with assistant and visitor avatars', () => {
    useAiChatMock.mockReturnValue({
      acceptConsent: vi.fn(),
      canRetryLastMessage: false,
      cancelStreaming: vi.fn(),
      clearPresentation: vi.fn(),
      closeSession: vi.fn(),
      draftAssistantMessage: null,
      drawerState: 'open',
      dismissConsentModal: vi.fn(),
      errorMessage: null,
      hasConsentForToday: true,
      hideDrawer: vi.fn(),
      isBootstrappingSession: false,
      isConsentModalOpen: false,
      isDrawerOpen: true,
      isDrawerVisible: true,
      isStreaming: false,
      minimizeDrawer: vi.fn(),
      openDrawer: vi.fn(),
      presentation: {
        assistantAvatarSrc: '/img/avatar.jpg',
        assistantLabel: '付寅生',
        visitorLabel: '访客',
      },
      refreshSession: vi.fn(),
      registerPresentation: vi.fn(),
      restoreDrawer: vi.fn(),
      restoreReady: true,
      retryLastMessage: vi.fn(),
      sendMessage: vi.fn(),
      session: {
        sessionId: 'session-public-001',
        locale: 'zh',
        status: 'open',
        turnCount: 1,
        remainingTurns: 19,
        useKeyStatus: 'claimed',
        lead: {
          id: 'lead-public-001',
          locale: 'zh',
          displayName: '公开站访客',
          companyName: '',
          contact: '',
          message: '',
          status: 'issued',
          createdAt: '2026-05-12T00:00:00.000Z',
          updatedAt: '2026-05-12T00:00:00.000Z',
        },
        messages: [
          {
            id: 'user-1',
            role: 'user',
            content: '你好，请介绍一下项目经验',
            turnIndex: 1,
            answerBlocks: [],
            citations: [],
            createdAt: '2026-05-12T00:00:00.000Z',
          },
          {
            id: 'assistant-1',
            role: 'assistant',
            content: '我最近主要在做公开简历与 AI 对话相关的工程整合。',
            turnIndex: 1,
            answerBlocks: [],
            citations: [],
            createdAt: '2026-05-12T00:00:01.000Z',
          },
        ],
        interimSummary: null,
        finalSummary: null,
        createdAt: '2026-05-12T00:00:00.000Z',
        updatedAt: '2026-05-12T00:00:01.000Z',
        closedAt: null,
      },
      summaryPreview: null,
      useKeyStatus: 'claimed',
      view: 'chat',
    })

    render(<AiChatDrawer locale="zh" />)

    expect(screen.getByText('付寅生')).toBeInTheDocument()
    expect(screen.getByText('访客')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('请提问项目经历、工作经历、技术栈或岗位匹配相关问题。')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '发送' })).toBeInTheDocument()
    expect(screen.getByText('你好，请介绍一下项目经验')).toBeInTheDocument()
    expect(screen.getByText('我最近主要在做公开简历与 AI 对话相关的工程整合。')).toBeInTheDocument()
  })

  it('should expose retry action when the latest stream failed', () => {
    const retryLastMessage = vi.fn()

    useAiChatMock.mockReturnValue({
      acceptConsent: vi.fn(),
      canRetryLastMessage: true,
      cancelStreaming: vi.fn(),
      clearPresentation: vi.fn(),
      closeSession: vi.fn(),
      draftAssistantMessage: null,
      drawerState: 'open',
      dismissConsentModal: vi.fn(),
      errorMessage: 'fetch failed',
      hasConsentForToday: true,
      hideDrawer: vi.fn(),
      isBootstrappingSession: false,
      isConsentModalOpen: false,
      isDrawerOpen: true,
      isDrawerVisible: true,
      isStreaming: false,
      minimizeDrawer: vi.fn(),
      openDrawer: vi.fn(),
      presentation: {
        assistantAvatarSrc: '/img/avatar.jpg',
        assistantLabel: '付寅生',
        visitorLabel: '访客',
      },
      refreshSession: vi.fn(),
      registerPresentation: vi.fn(),
      restoreDrawer: vi.fn(),
      restoreReady: true,
      retryLastMessage,
      sendMessage: vi.fn(),
      session: {
        sessionId: 'session-public-001',
        locale: 'zh',
        status: 'open',
        turnCount: 1,
        remainingTurns: 19,
        useKeyStatus: 'claimed',
        lead: {
          id: 'lead-public-001',
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
      summaryPreview: null,
      useKeyStatus: 'claimed',
      view: 'chat',
    })

    render(<AiChatDrawer locale="zh" />)

    expect(screen.getByText('fetch failed')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '重试上一条' })).toBeInTheDocument()
  })
})
