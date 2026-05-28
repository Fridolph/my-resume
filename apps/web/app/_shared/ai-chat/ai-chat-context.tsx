'use client'

import {
  createClaimPublicAiChatSessionMethod,
  createCloseAiChatSessionMethod,
  createFetchAiChatSessionMethod,
  streamAiChatMessage,
} from '@my-resume/api-client'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import { AiChatConsentModal } from './ai-chat-consent-modal'
import { AiChatDock } from './ai-chat-dock'
import { AiChatDrawer } from './ai-chat-drawer'
import type {
  AiChatContextValue,
  AiChatDraftAssistantMessage,
  AiChatDrawerState,
  AiChatPresentation,
} from './ai-chat.types'

const AI_CHAT_STORAGE_KEY = 'my-resume-web-ai-chat'
const AI_CHAT_CONSENT_POLICY_VERSION = 'm23-public-ip-v1'
export const AI_CHAT_OPEN_EVENT = 'my-resume:open-ai-chat'
const AiChatContext = createContext<AiChatContextValue | null>(null)

function buildDefaultPresentation(locale: 'zh' | 'en'): AiChatPresentation {
  return {
    assistantAvatarSrc: null,
    assistantLabel: locale === 'en' ? 'Resume Companion' : '简历助手',
    visitorLabel: locale === 'en' ? 'Visitor' : '访客',
  }
}

function buildTodayKey() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function readStoredSession() {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const raw = window.localStorage.getItem(AI_CHAT_STORAGE_KEY)
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as {
      consentDay?: string
      consentPolicyVersion?: string
      sessionId?: string
      useKey?: string
    }

    return {
      consentDay: parsed.consentDay ?? null,
      consentPolicyVersion: parsed.consentPolicyVersion ?? null,
      sessionId: parsed.sessionId ?? null,
      useKey: parsed.useKey ?? null,
    }
  } catch {
    return null
  }
}

function writeStoredSession(value: {
  consentDay: string | null
  consentPolicyVersion: string | null
  sessionId: string | null
  useKey: string | null
} | null) {
  if (typeof window === 'undefined') {
    return
  }

  if (!value) {
    window.localStorage.removeItem(AI_CHAT_STORAGE_KEY)
    return
  }

  window.localStorage.setItem(AI_CHAT_STORAGE_KEY, JSON.stringify(value))
}

function hasConsentForToday(consentDay: string | null, policyVersion: string | null) {
  return consentDay === buildTodayKey() && policyVersion === AI_CHAT_CONSENT_POLICY_VERSION
}

function normalizeAiChatErrorMessage(
  error: unknown,
  locale: 'zh' | 'en',
  fallback: 'session' | 'message',
) {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  if (fallback === 'session') {
    return locale === 'en'
      ? 'AI chat could not be initialized. Please try again later.'
      : 'AI 对话初始化失败，请稍后重试。'
  }

  return locale === 'en'
    ? 'Message delivery failed. Please retry in a moment.'
    : '消息发送失败，请稍后重试。'
}

export function AiChatProvider({
  apiBaseUrl,
  children,
  locale,
}: {
  apiBaseUrl: string
  children: ReactNode
  locale: 'zh' | 'en'
}) {
  const [drawerState, setDrawerState] = useState<AiChatDrawerState>('closed')
  const [restoreReady, setRestoreReady] = useState(false)
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false)
  const [isBootstrappingSession, setIsBootstrappingSession] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [activeUseKey, setActiveUseKey] = useState<string | null>(null)
  const [session, setSession] = useState<AiChatContextValue['session']>(null)
  const [useKeyStatus, setUseKeyStatus] = useState<string | null>(null)
  const [summaryPreview, setSummaryPreview] = useState<AiChatContextValue['summaryPreview']>(null)
  const [draftAssistantMessage, setDraftAssistantMessage] = useState<AiChatDraftAssistantMessage | null>(null)
  const [consentDay, setConsentDay] = useState<string | null>(null)
  const [lastSubmittedMessage, setLastSubmittedMessage] = useState<string | null>(null)
  const [presentation, setPresentation] = useState<AiChatPresentation>(() =>
    buildDefaultPresentation(locale),
  )
  const streamAbortControllerRef = useRef<AbortController | null>(null)

  const clearPresentation = useCallback(() => {
    setPresentation(buildDefaultPresentation(locale))
  }, [locale])

  const registerPresentation = useCallback((input: AiChatPresentation) => {
    setPresentation(input)
  }, [])

  const refreshSession = useCallback(async () => {
    const stored = readStoredSession()
    const storedHasConsent = hasConsentForToday(
      stored?.consentDay ?? null,
      stored?.consentPolicyVersion ?? null,
    )

    setConsentDay(storedHasConsent ? stored?.consentDay ?? null : null)
    setDrawerState('closed')

    if (!storedHasConsent || !stored?.sessionId || !stored.useKey) {
      setSession(null)
      setUseKeyStatus(null)
      setActiveUseKey(null)
      return
    }

    setActiveUseKey(stored.useKey)

    const nextSession = await createFetchAiChatSessionMethod({
      apiBaseUrl,
      sessionId: stored.sessionId,
      useKey: stored.useKey,
    }).send()

    setSession(nextSession)
    setUseKeyStatus(nextSession.useKeyStatus)
    setSummaryPreview(nextSession.finalSummary ?? nextSession.interimSummary)
  }, [apiBaseUrl])

  const syncCurrentSessionSnapshot = useCallback(async () => {
    if (!session || !activeUseKey) {
      return false
    }

    const nextSession = await createFetchAiChatSessionMethod({
      apiBaseUrl,
      sessionId: session.sessionId,
      useKey: activeUseKey,
    }).send()

    setSession(nextSession)
    setUseKeyStatus(nextSession.useKeyStatus)
    setSummaryPreview(nextSession.finalSummary ?? nextSession.interimSummary)

    return true
  }, [activeUseKey, apiBaseUrl, session])

  const rollbackOptimisticUserMessage = useCallback((optimisticId: string) => {
    setSession((current) => {
      if (!current || !current.messages.some((message) => message.id === optimisticId)) {
        return current
      }

      return {
        ...current,
        messages: current.messages.filter((message) => message.id !== optimisticId),
        turnCount: Math.max(0, current.turnCount - 1),
        remainingTurns: Math.min(20, current.remainingTurns + 1),
      }
    })
  }, [])

  const claimPublicSession = useCallback(async () => {
    // Open the global drawer immediately so repeated clicks after today's
    // consent still provide visible feedback while the public session is
    // being restored or created in the background.
    setDrawerState('open')
    setIsConsentModalOpen(false)
    setIsBootstrappingSession(true)
    setErrorMessage(null)

    try {
      const result = await createClaimPublicAiChatSessionMethod({
        apiBaseUrl,
        consentAccepted: true,
        locale,
      }).send()

      setActiveUseKey(result.useKey)
      setSession(result.session)
      setUseKeyStatus(result.session.useKeyStatus)
      setSummaryPreview(result.session.finalSummary ?? result.session.interimSummary)
      setConsentDay(buildTodayKey())
    } catch (error) {
      setErrorMessage(normalizeAiChatErrorMessage(error, locale, 'session'))
      setDrawerState('closed')
      setSession(null)
      setUseKeyStatus(null)
      setActiveUseKey(null)
    } finally {
      setIsBootstrappingSession(false)
    }
  }, [apiBaseUrl, locale])

  const openDrawer = useCallback(() => {
    setErrorMessage(null)

    if (isBootstrappingSession) {
      return
    }

    if (!hasConsentForToday(consentDay, AI_CHAT_CONSENT_POLICY_VERSION)) {
      setIsConsentModalOpen(true)
      return
    }

    if (!session || !activeUseKey) {
      void claimPublicSession()
      return
    }

    // 有既有会话时先验证是否仍然有效，避免 admin 端删 key 后闪一下就关
    setDrawerState('open')
    setIsBootstrappingSession(true)

    createFetchAiChatSessionMethod({
      apiBaseUrl,
      sessionId: session.sessionId,
      useKey: activeUseKey,
    })
      .send()
      .then((nextSession) => {
        setSession(nextSession)
        setUseKeyStatus(nextSession.useKeyStatus)
        setSummaryPreview(nextSession.finalSummary ?? nextSession.interimSummary)
        setIsBootstrappingSession(false)
      })
      .catch(() => {
        // 会话失效（被 admin 删除等），清空状态后走新会话认领
        setSession(null)
        setUseKeyStatus(null)
        setActiveUseKey(null)
        setIsBootstrappingSession(false)
        void claimPublicSession()
      })
  }, [apiBaseUrl, claimPublicSession, consentDay, isBootstrappingSession, session, activeUseKey])

  useEffect(() => {
    void refreshSession().catch(() => undefined).finally(() => setRestoreReady(true))
  }, [refreshSession])

  useEffect(() => {
    if (typeof window === 'undefined' || !restoreReady) {
      return
    }

    const nextConsentDay = hasConsentForToday(consentDay, AI_CHAT_CONSENT_POLICY_VERSION)
      ? consentDay
      : null

    if (!nextConsentDay && !session && drawerState === 'closed') {
      writeStoredSession(null)
      return
    }

    writeStoredSession({
      consentDay: nextConsentDay,
      consentPolicyVersion: nextConsentDay ? AI_CHAT_CONSENT_POLICY_VERSION : null,
      sessionId: session?.sessionId ?? null,
      useKey: activeUseKey,
    })
  }, [activeUseKey, consentDay, restoreReady, session])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const handleOpen = () => {
      openDrawer()
    }

    window.addEventListener(AI_CHAT_OPEN_EVENT, handleOpen)
    return () => {
      window.removeEventListener(AI_CHAT_OPEN_EVENT, handleOpen)
    }
  }, [openDrawer])

  const sendMessage = useCallback(
    async (input: { content: string }) => {
      if (!session || !activeUseKey) {
        setErrorMessage(
          locale === 'en'
            ? 'No active AI chat session is available right now.'
            : '当前没有可用的 AI 对话会话。',
        )
        return false
      }

      const content = input.content.trim()

      if (!content) {
        return false
      }

      setIsStreaming(true)
      setErrorMessage(null)
      setLastSubmittedMessage(content)
      setDraftAssistantMessage({
        assistantMessageId: null,
        answerBlocks: [],
        citations: [],
        content: '',
      })
      const abortController = new AbortController()
      streamAbortControllerRef.current = abortController

      // 乐观添加用户消息，实现"发送即见"的即时反馈
      const optimisticId = `optimistic-${Date.now()}`
      setSession((current) =>
        current
          ? {
              ...current,
              messages: [
                ...current.messages,
                {
                  id: optimisticId,
                  role: 'user' as const,
                  content,
                  turnIndex: (current.turnCount ?? 0) + 1,
                  answerBlocks: [],
                  citations: [],
                  createdAt: new Date().toISOString(),
                },
              ],
              turnCount: (current.turnCount ?? 0) + 1,
              remainingTurns: Math.max(0, (current.remainingTurns ?? 20) - 1),
            }
          : current,
      )

      try {
        await streamAiChatMessage(
          {
            apiBaseUrl,
            sessionId: session.sessionId,
            useKey: activeUseKey,
            content,
            locale,
            signal: abortController.signal,
          },
          {
            onStart: (payload) => {
              setDraftAssistantMessage((current) => ({
                assistantMessageId: payload.assistantMessageId,
                answerBlocks: current?.answerBlocks ?? [],
                citations: current?.citations ?? [],
                content: current?.content ?? '',
              }))
            },
            onToken: (payload) => {
              setDraftAssistantMessage((current) =>
                current
                  ? {
                      ...current,
                      content: `${current.content}${payload.text}`,
                    }
                  : current,
              )
            },
            onCitation: (payload) => {
              setDraftAssistantMessage((current) =>
                current
                  ? {
                      ...current,
                      citations: [...current.citations, payload],
                    }
                  : current,
              )
            },
            onBlock: (payload) => {
              setDraftAssistantMessage((current) =>
                current
                  ? {
                      ...current,
                      answerBlocks: [...current.answerBlocks, payload],
                    }
                  : current,
              )
            },
            onSummary: (payload) => setSummaryPreview(payload),
            onDone: (payload) => {
              setDraftAssistantMessage(null)
              setSession(payload.session)
              setUseKeyStatus(payload.session.useKeyStatus)
              setSummaryPreview(payload.session.finalSummary ?? payload.session.interimSummary)
            },
            onError: (payload) => {
              setDraftAssistantMessage(null)
              setErrorMessage(payload.message)
            },
          },
        )
        return true
      } catch (error) {
        const isAbortError =
          error instanceof DOMException
            ? error.name === 'AbortError'
            : error instanceof Error
              ? error.name === 'AbortError'
              : false

        const synced = await syncCurrentSessionSnapshot().catch(() => false)

        if (!synced) {
          rollbackOptimisticUserMessage(optimisticId)
        }

        setDraftAssistantMessage(null)
        setErrorMessage(
          isAbortError ? null : normalizeAiChatErrorMessage(error, locale, 'message'),
        )
        return false
      } finally {
        if (streamAbortControllerRef.current === abortController) {
          streamAbortControllerRef.current = null
        }
        setIsStreaming(false)
      }
    },
    [
      activeUseKey,
      apiBaseUrl,
      locale,
      rollbackOptimisticUserMessage,
      session,
      syncCurrentSessionSnapshot,
    ],
  )

  const cancelStreaming = useCallback(async () => {
    if (!streamAbortControllerRef.current) {
      return
    }

    streamAbortControllerRef.current.abort()
  }, [])

  const retryLastMessage = useCallback(async () => {
    if (!lastSubmittedMessage || isStreaming) {
      return false
    }

    return sendMessage({ content: lastSubmittedMessage })
  }, [isStreaming, lastSubmittedMessage, sendMessage])

  const closeSession = useCallback(async () => {
    if (!session || !activeUseKey) {
      return
    }

    const nextSession = await createCloseAiChatSessionMethod({
      apiBaseUrl,
      sessionId: session.sessionId,
      useKey: activeUseKey,
    }).send()

    setSession(nextSession)
    setUseKeyStatus(nextSession.useKeyStatus)
    setSummaryPreview(nextSession.finalSummary ?? nextSession.interimSummary)
  }, [activeUseKey, apiBaseUrl, session])

  const value = useMemo<AiChatContextValue>(
    () => ({
      acceptConsent: async () => {
        await claimPublicSession()
      },
      canRetryLastMessage: Boolean(lastSubmittedMessage && !isStreaming && session),
      cancelStreaming,
      clearPresentation,
      closeSession,
      dismissConsentModal: () => setIsConsentModalOpen(false),
      draftAssistantMessage,
      drawerState,
      errorMessage,
      hasConsentForToday: hasConsentForToday(consentDay, AI_CHAT_CONSENT_POLICY_VERSION),
      isBootstrappingSession,
      isConsentModalOpen,
      isDrawerOpen: drawerState === 'open',
      isDrawerVisible: drawerState !== 'closed',
      isStreaming,
      hideDrawer: () => setDrawerState('closed'),
      minimizeDrawer: () => setDrawerState('minimized'),
      openDrawer,
      presentation,
      refreshSession,
      registerPresentation,
      restoreDrawer: () => setDrawerState('open'),
      restoreReady,
      retryLastMessage,
      sendMessage,
      session,
      summaryPreview,
      useKeyStatus,
      view:
        isBootstrappingSession && !session
          ? 'loading'
          : session
            ? session.status === 'closed'
              ? 'closed'
              : 'chat'
            : 'loading',
    }),
    [
      cancelStreaming,
      claimPublicSession,
      clearPresentation,
      closeSession,
      consentDay,
      draftAssistantMessage,
      drawerState,
      errorMessage,
      isBootstrappingSession,
      isConsentModalOpen,
      isStreaming,
      lastSubmittedMessage,
      openDrawer,
      presentation,
      refreshSession,
      registerPresentation,
      restoreReady,
      retryLastMessage,
      sendMessage,
      session,
      summaryPreview,
      useKeyStatus,
    ],
  )

  return (
    <AiChatContext.Provider value={value}>
      {children}
      <AiChatConsentModal locale={locale} />
      <AiChatDrawer locale={locale} />
      <AiChatDock locale={locale} />
    </AiChatContext.Provider>
  )
}

export function useAiChat() {
  const context = useContext(AiChatContext)

  if (!context) {
    throw new Error('useAiChat must be used within AiChatProvider')
  }

  return context
}

export function useOptionalAiChat() {
  return useContext(AiChatContext)
}

export function emitGlobalAiChatOpen() {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(new Event(AI_CHAT_OPEN_EVENT))
}
