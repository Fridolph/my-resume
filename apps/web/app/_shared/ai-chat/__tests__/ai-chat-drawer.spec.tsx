import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
    expect(screen.getByRole('dialog', { name: 'AI 对话' })).toHaveAttribute(
      'aria-modal',
      'false',
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

  it('should render citation references as hoverable tooltips', async () => {
    const user = userEvent.setup()

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
            id: 'assistant-1',
            role: 'assistant',
            content: '我最近在做一个叫 my-resume 的个人项目 [#1]。',
            turnIndex: 1,
            answerBlocks: [],
            citations: [
              {
                ref: '#1',
                sourceType: 'resume_core',
                sourcePath: 'resume-core',
                section: 'project',
                title: 'my-resume',
                score: 0.987,
                snippet: '这是一个全栈个人项目。',
              },
            ],
            createdAt: '2026-05-12T00:00:00.000Z',
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

    expect(screen.getByText('#1')).toBeInTheDocument()

    await user.hover(screen.getByText('#1'))

    expect(await screen.findByText('my-resume')).toBeInTheDocument()
    expect(screen.getByText('简历核心')).toBeInTheDocument()
    expect(screen.getByText('这是一个全栈个人项目。')).toBeInTheDocument()
  })

  it('should render plain #ref citations as hoverable tooltips too', async () => {
    const user = userEvent.setup()

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
        sessionId: 'session-public-002',
        locale: 'zh',
        status: 'open',
        turnCount: 1,
        remainingTurns: 19,
        useKeyStatus: 'claimed',
        lead: {
          id: 'lead-public-002',
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
            id: 'assistant-2',
            role: 'assistant',
            content: '这个简历站项目也顺手把 SSR 和 SEO 跑通了一遍 #2。',
            turnIndex: 1,
            answerBlocks: [],
            citations: [
              {
                ref: '#2',
                sourceType: 'resume_core',
                sourcePath: 'resume-core',
                section: 'project',
                title: 'my-resume web',
                score: 0.912,
                snippet: '联当展示站使用，也顺手把 SSR、SEO 这些东西在真实场景里跑了一遍。',
              },
            ],
            createdAt: '2026-05-12T00:00:00.000Z',
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

    expect(screen.getByText('#2')).toBeInTheDocument()

    await user.hover(screen.getByText('#2'))

    expect(await screen.findByText('my-resume web')).toBeInTheDocument()
    expect(screen.getByText(/SSR、SEO/)).toBeInTheDocument()
  })

  it('should keep tooltip visible when cursor moves onto tooltip content', async () => {
    const user = userEvent.setup()

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
        sessionId: 'session-public-004',
        locale: 'zh',
        status: 'open',
        turnCount: 1,
        remainingTurns: 19,
        useKeyStatus: 'claimed',
        lead: {
          id: 'lead-public-004',
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
            id: 'assistant-4',
            role: 'assistant',
            content: '我最近在做一个叫 my-resume 的个人项目 [#1]。',
            turnIndex: 1,
            answerBlocks: [],
            citations: [
              {
                ref: '#1',
                sourceType: 'resume_core',
                sourcePath: 'resume-core',
                section: 'project',
                title: 'my-resume',
                score: 0.987,
                snippet: '这是一个全栈个人项目。',
              },
            ],
            createdAt: '2026-05-12T00:00:00.000Z',
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

    const trigger = screen.getByText('#1')
    await user.hover(trigger)

    const tooltipTitle = await screen.findByText('my-resume')
    expect(tooltipTitle).toBeInTheDocument()

    await user.unhover(trigger)
    await user.hover(tooltipTitle)

    expect(screen.getByText('这是一个全栈个人项目。')).toBeInTheDocument()
  })

  it('should hide custom citation cards while keeping citation chips visible', () => {
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
        sessionId: 'session-public-005',
        locale: 'zh',
        status: 'open',
        turnCount: 1,
        remainingTurns: 19,
        useKeyStatus: 'claimed',
        lead: {
          id: 'lead-public-005',
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
            id: 'assistant-5',
            role: 'assistant',
            content: '我平时还喜欢音乐和羽毛球 #1 #2。',
            turnIndex: 1,
            answerBlocks: [
              {
                type: 'hobby_card',
                title: '音乐.md',
                description: '我喜欢音乐',
                keywords: [],
              },
              {
                type: 'article_card',
                title: 'JS全栈 AI Agent 学习',
                summary: 'RAG 怎么做',
                keywords: [],
              },
            ],
            citations: [
              {
                ref: '#1',
                sourceType: 'user_docs',
                sourcePath: 'music',
                section: 'interest',
                title: '音乐.md',
                snippet: '我喜欢音乐',
              },
              {
                ref: '#2',
                sourceType: 'knowledge',
                sourcePath: 'rag',
                section: 'article',
                title: 'JS全栈 AI Agent 学习',
                snippet: 'RAG 怎么做',
              },
            ],
            createdAt: '2026-05-12T00:00:00.000Z',
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

    expect(screen.getByText('引用：')).toBeInTheDocument()
    expect(screen.getByText('#1')).toBeInTheDocument()
    expect(screen.getByText('#2')).toBeInTheDocument()
    expect(screen.queryByText('音乐.md')).not.toBeInTheDocument()
    expect(screen.queryByText('JS全栈 AI Agent 学习')).not.toBeInTheDocument()
  })

  it('should keep textarea editable while streaming but disable send action', async () => {
    const onSend = vi.fn()

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
      isStreaming: true,
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
      sendMessage: onSend,
      session: {
        sessionId: 'session-public-003',
        locale: 'zh',
        status: 'open',
        turnCount: 1,
        remainingTurns: 19,
        useKeyStatus: 'claimed',
        lead: {
          id: 'lead-public-003',
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

    const textarea = screen.getByPlaceholderText('请提问项目经历、工作经历、技术栈或岗位匹配相关问题。')
    const sendButton = screen.getByRole('button', { name: '发送中...' })

    expect(textarea).not.toBeDisabled()
    expect(sendButton).toBeDisabled()
  })
})
