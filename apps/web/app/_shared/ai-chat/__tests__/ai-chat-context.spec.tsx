import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@my-resume/api-client', () => ({
  createClaimPublicAiChatSessionMethod: vi.fn(() => ({
    send: vi.fn().mockResolvedValue({
      consentRecordedAt: '2026-05-12T00:00:00.000Z',
      policyVersion: 'm23-public-ip-v1',
      turnsPerDay: 20,
      useKey: 'FY-9ABC1234',
      session: {
        sessionId: 'session-public-001',
        locale: 'zh',
        status: 'open',
        turnCount: 0,
        remainingTurns: 20,
        useKeyStatus: 'claimed',
        lead: {
          id: 'lead-public-001',
          locale: 'zh',
          displayName: '公开站访客',
          companyName: '',
          contact: '',
          message: '访客已同意公开站 AI 对话提示，系统自动创建当日会话。',
          status: 'issued',
          createdAt: '2026-05-12T00:00:00.000Z',
          updatedAt: '2026-05-12T00:00:00.000Z',
        },
        messages: [],
        interimSummary: null,
        finalSummary: null,
        createdAt: '2026-05-12T00:00:00.000Z',
        updatedAt: '2026-05-12T00:00:00.000Z',
        closedAt: null,
      },
    }),
  })),
  createCloseAiChatSessionMethod: vi.fn(() => ({ send: vi.fn() })),
  createFetchAiChatSessionMethod: vi.fn(() => ({ send: vi.fn() })),
  streamAiChatMessage: vi.fn(),
}))

import { createClaimPublicAiChatSessionMethod, streamAiChatMessage } from '@my-resume/api-client'
import type { AiChatPublicSessionClaimResult } from '@my-resume/api-client'
import { AiChatProvider, useAiChat } from '../ai-chat-context'

function Probe() {
  const {
    acceptConsent,
    drawerState,
    errorMessage,
    isConsentModalOpen,
    isStreaming,
    openDrawer,
    sendMessage,
  } = useAiChat()

  return (
    <div>
      <button onClick={openDrawer} type="button">
        open-chat
      </button>
      <button aria-label="probe-accept-consent" onClick={() => void acceptConsent()} type="button">
        accept-consent
      </button>
      <button aria-label="probe-send-message" onClick={() => void sendMessage({ content: '你好' })} type="button">
        send-message
      </button>
      <span>{drawerState}</span>
      <span>{String(isConsentModalOpen)}</span>
      <span>{errorMessage ?? 'no-error'}</span>
      <span>{String(isStreaming)}</span>
    </div>
  )
}

describe('AiChatProvider', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    window.localStorage.clear()
  })

  it('should open consent modal first, then switch between open and minimized global chat states', async () => {
    const user = userEvent.setup()

    render(
      <AiChatProvider apiBaseUrl="http://localhost:5577" locale="zh">
        <Probe />
      </AiChatProvider>,
    )

    expect(screen.getByText('closed')).toBeInTheDocument()
    expect(screen.queryByLabelText('恢复 AI 对话抽屉')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'open-chat' }))

    expect(screen.getByText('true')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '开始 AI 对话' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '同意并继续' }))

    expect(screen.getByText('open')).toBeInTheDocument()
    expect((await screen.findAllByRole('heading', { name: 'AI 对话' })).length).toBeGreaterThan(0)

    await user.click(screen.getByRole('button', { name: '最小化 AI 对话' }))

    expect(screen.getByText('minimized')).toBeInTheDocument()
    expect(await screen.findByLabelText('恢复 AI 对话抽屉')).toBeInTheDocument()

    await user.click(screen.getByLabelText('恢复 AI 对话抽屉'))

    await waitFor(() => {
      expect(screen.getByText('open')).toBeInTheDocument()
    })
    expect((await screen.findAllByRole('heading', { name: 'AI 对话' })).length).toBeGreaterThan(0)

    await user.click(screen.getByRole('button', { name: '关闭 AI 对话' }))

    await waitFor(() => {
      expect(screen.getByText('closed')).toBeInTheDocument()
    })
    expect(screen.queryByLabelText('恢复 AI 对话抽屉')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'open-chat' }))

    await waitFor(() => {
      expect(screen.getByText('open')).toBeInTheDocument()
    })
  })

  it('should restore the stored session but keep the drawer hidden until the user opens it again', async () => {
    const today = new Date()
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    window.localStorage.setItem(
      'my-resume-web-ai-chat',
      JSON.stringify({
        consentDay: todayKey,
        consentPolicyVersion: 'm23-public-ip-v1',
        drawerState: 'open',
        sessionId: 'session-public-001',
        useKey: 'FY-9ABC1234',
      }),
    )

    render(
      <AiChatProvider apiBaseUrl="http://localhost:5577" locale="zh">
        <Probe />
      </AiChatProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText('closed')).toBeInTheDocument()
    })
    expect(screen.queryByLabelText('恢复 AI 对话抽屉')).not.toBeInTheDocument()
  })

  it('should immediately show the loading drawer when today consent already exists but session must be re-claimed', async () => {
    const user = userEvent.setup()
    const today = new Date()
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    const pendingPromise = new Promise<AiChatPublicSessionClaimResult>(() => undefined)

    vi.mocked(createClaimPublicAiChatSessionMethod).mockImplementationOnce(
      () =>
        ({
          send: vi.fn(() => pendingPromise),
        }) as unknown as ReturnType<typeof createClaimPublicAiChatSessionMethod>,
    )

    window.localStorage.setItem(
      'my-resume-web-ai-chat',
      JSON.stringify({
        consentDay: todayKey,
        consentPolicyVersion: 'm23-public-ip-v1',
        drawerState: 'closed',
      }),
    )

    render(
      <AiChatProvider apiBaseUrl="http://localhost:5577" locale="zh">
        <Probe />
      </AiChatProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'open-chat' }))

    expect(screen.getByText('open')).toBeInTheDocument()
    expect((await screen.findAllByRole('heading', { name: 'AI 对话' })).length).toBeGreaterThan(0)
    expect(screen.getByText('正在启动 AI 对话...')).toBeInTheDocument()
  })

  it('should keep the drawer usable and expose a readable error when message streaming fails before SSE starts', async () => {
    const user = userEvent.setup()

    vi.mocked(streamAiChatMessage).mockRejectedValueOnce(new TypeError('fetch failed'))

    render(
      <AiChatProvider apiBaseUrl="http://localhost:5577" locale="zh">
        <Probe />
      </AiChatProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'open-chat' }))
    await user.click(screen.getByRole('button', { name: '同意并继续' }))
    expect((await screen.findAllByRole('heading', { name: 'AI 对话' })).length).toBeGreaterThan(0)

    await user.click(screen.getByLabelText('probe-send-message'))

    await waitFor(() => {
      expect(screen.getAllByText('fetch failed').length).toBeGreaterThan(0)
    })
    expect(screen.getByText('open')).toBeInTheDocument()
  })
})
