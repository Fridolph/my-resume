'use client'

import { Button, Chip, CloseButton, Spinner } from '@heroui/react'
import { useEffect, useMemo, useRef, useState } from 'react'

import type { AiChatMessage, AiChatSession } from '@my-resume/api-client'
import { AiChatComposer } from './ai-chat-composer'
import { useAiChat } from './ai-chat-context'
import { AiChatMessageList } from './ai-chat-message-list'
import { AiChatWindowShell } from './ai-chat-window-shell'

function buildVisibleMessages(
  session: AiChatSession | null,
  draft: ReturnType<typeof useAiChat>['draftAssistantMessage'],
) {
  const base = session?.messages ?? []

  if (!draft || !draft.content.trim()) {
    return base
  }

  // 去重：onDone 已将真实消息写入 session.messages，不再追加 draft 避免重复
  const alreadyInSession = draft.assistantMessageId
    ? base.some((message) => message.id === draft.assistantMessageId)
    : false

  if (alreadyInSession) {
    return base
  }

  return [
    ...base,
    {
      id: draft.assistantMessageId ?? 'draft-assistant-message',
      role: 'assistant' as const,
      content: draft.content,
      turnIndex: session?.turnCount ?? 0,
      answerBlocks: draft.answerBlocks,
      citations: draft.citations,
      createdAt: new Date().toISOString(),
    } satisfies AiChatMessage,
  ]
}

function DrawerStatusPill({
  children,
  tone = 'neutral',
}: {
  children: string
  tone?: 'accent' | 'neutral' | 'success'
}) {
  const toneClassName =
    tone === 'accent'
      ? 'border-sky-200/80 bg-sky-500/10 text-sky-700 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-200'
      : tone === 'success'
        ? 'border-emerald-200/80 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200'
        : 'border-zinc-200/80 bg-white/75 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-300'

  return (
    <span
      className={[
        'inline-flex items-center rounded-full border px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em]',
        toneClassName,
      ].join(' ')}>
      {children}
    </span>
  )
}

function buildSubtitle({
  locale,
  session,
  view,
}: {
  locale: 'zh' | 'en'
  session: AiChatSession | null
  view: ReturnType<typeof useAiChat>['view']
}) {
  if (view === 'loading') {
    return locale === 'en'
      ? 'Resume Companion · Resume-only chat · Preparing your session'
      : 'Resume Companion · 仅限简历相关 · 正在准备会话'
  }

  if (view === 'closed') {
    return locale === 'en'
      ? `Resume Companion · Resume-only chat · Turns ${session?.turnCount ?? 0}/20`
      : `Resume Companion · 仅限简历相关 · 已提问 ${session?.turnCount ?? 0}/20`
  }

  return locale === 'en'
    ? `Resume Companion · Resume-only chat · Turns ${session?.turnCount ?? 0}/20`
    : `Resume Companion · 仅限简历相关 · 已提问 ${session?.turnCount ?? 0}/20`
}

export function AiChatDrawer({ locale }: { locale: 'zh' | 'en' }) {
  const {
    canRetryLastMessage,
    cancelStreaming,
    draftAssistantMessage,
    errorMessage,
    hideDrawer,
    isBootstrappingSession,
    isDrawerOpen,
    isStreaming,
    minimizeDrawer,
    presentation,
    retryLastMessage,
    sendMessage,
    session,
    summaryPreview,
    view,
  } = useAiChat()
  const [chatMessage, setChatMessage] = useState('')
  const [dismissedSummaryStage, setDismissedSummaryStage] = useState<string | null>(
    () => localStorage.getItem('my-resume:ai-chat:summary-dismissed') ?? null,
  )
  const [dismissedClosedBanner, setDismissedClosedBanner] = useState(false)
  const messageListRef = useRef<HTMLDivElement | null>(null)
  const prevMessageCountRef = useRef(0)
  const visibleMessages = useMemo(
    () => buildVisibleMessages(session, draftAssistantMessage),
    [draftAssistantMessage, session],
  )

  // 消息列表滚动控制：
  // - 用户发送消息后立即滚动到底部
  // - SSE 流式输出期间不强制滚动（用户可能正在阅读）
  // - 流式结束后延迟 600ms 滚动到底部
  useEffect(() => {
    const count = visibleMessages.length

    if (count > prevMessageCountRef.current) {
      if (messageListRef.current) {
        messageListRef.current.scrollTop = messageListRef.current.scrollHeight
      }
    }

    prevMessageCountRef.current = count
  }, [visibleMessages.length])

  useEffect(() => {
    if (!isStreaming && messageListRef.current) {
      const timer = setTimeout(() => {
        if (messageListRef.current) {
          messageListRef.current.scrollTop = messageListRef.current.scrollHeight
        }
      }, 600)
      return () => clearTimeout(timer)
    }
  }, [isStreaming])
  const statusContent = (
    <DrawerStatusPill tone={view === 'closed' ? 'success' : 'accent'}>
      {view === 'loading'
        ? locale === 'en'
          ? 'Starting'
          : '启动中'
        : view === 'closed'
          ? locale === 'en'
            ? 'Closed'
            : '已结束'
          : locale === 'en'
            ? 'In session'
            : '进行中'}
    </DrawerStatusPill>
  )
  const footerContent =
    view === 'chat' ? (
      <AiChatComposer
        isRetryAvailable={canRetryLastMessage}
        isStreaming={isStreaming}
        locale={locale}
        onCancel={cancelStreaming}
        onChange={setChatMessage}
        onSend={async () => {
          const message = chatMessage
          setChatMessage('')
          await sendMessage({ content: message })
        }}
        value={chatMessage}
      />
    ) : null

  return (
    <AiChatWindowShell
      footer={footerContent}
      isOpen={isDrawerOpen}
      locale={locale}
      onHide={hideDrawer}
      onMinimize={minimizeDrawer}
      status={statusContent}
      subtitle={buildSubtitle({ locale, session, view })}
      title={locale === 'en' ? 'AI Chat' : 'AI 对话'}>
      {errorMessage ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200/80 bg-rose-50/80 px-3 py-2 text-sm text-rose-900 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-100">
          <span>{errorMessage}</span>
          {canRetryLastMessage ? (
            <Button
              onPress={() => void retryLastMessage()}
              size="sm"
              variant="outline">
              {locale === 'en' ? 'Retry last message' : '重试上一条'}
            </Button>
          ) : null}
        </div>
      ) : null}

      {summaryPreview && summaryPreview.stage !== dismissedSummaryStage ? (
        <div className="rounded-[1.25rem] border border-emerald-200/80 bg-emerald-50/70 px-4 py-3 dark:border-emerald-500/20 dark:bg-emerald-500/10">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <Chip variant="soft">
              {summaryPreview.stage === 'turn-20'
                ? locale === 'en'
                  ? 'Final summary'
                  : '最终总结'
                : locale === 'en'
                  ? 'Stage summary'
                  : '阶段总结'}
              </Chip>
              <CloseButton
                aria-label={locale === 'en' ? 'Close summary' : '关闭总结'}
                onPress={() => {
                  localStorage.setItem('my-resume:ai-chat:summary-dismissed', summaryPreview.stage)
                  setDismissedSummaryStage(summaryPreview.stage)
                }}
              />
          </div>
          <p className="text-sm leading-6 text-emerald-950 dark:text-emerald-100">
            {summaryPreview.summary}
          </p>
        </div>
      ) : null}

      {view === 'loading' ? (
        <div className="grid place-items-center gap-3 rounded-[1.5rem] border border-zinc-200/80 bg-white/75 px-5 py-10 text-center shadow-[0_18px_44px_rgba(15,23,42,0.06)] dark:border-zinc-800 dark:bg-zinc-950/60">
          <Spinner size="lg" />
          <div className="grid gap-1">
            <strong className="text-sm text-zinc-950 dark:text-white">
              {locale === 'en' ? 'Starting AI chat...' : '正在启动 AI 对话...'}
            </strong>
            <p className="text-sm leading-6 text-zinc-500 dark:text-zinc-400">
              {isBootstrappingSession
                ? locale === 'en'
                  ? 'Creating or restoring today’s resume-only session.'
                  : '正在创建或恢复今天的简历问答会话。'
                : locale === 'en'
                  ? 'Waiting for the conversation to become available.'
                  : '正在等待当前对话会话准备完成。'}
            </p>
          </div>
        </div>
      ) : view === 'closed' && !dismissedClosedBanner ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] border border-emerald-200/80 bg-emerald-50/70 px-4 py-3 dark:border-emerald-500/20 dark:bg-emerald-500/10">
          <p className="text-sm leading-6 text-emerald-900 dark:text-emerald-100">
            {locale === 'en'
              ? 'Today\'s session has ended. You can review previous messages below, and a new quota will be available tomorrow.'
              : '今天的会话已经结束。你仍可浏览下方的历史消息，明天会恢复新的提问额度。'}
          </p>
          <CloseButton
            aria-label={locale === 'en' ? 'Dismiss' : '关闭'}
            onPress={() => setDismissedClosedBanner(true)}
          />
        </div>
      ) : null}
      {/* 非 loading 状态始终展示消息列表 */}
      {view !== 'loading' ? (
        <AiChatMessageList
          isStreaming={isStreaming}
          locale={locale}
          messages={visibleMessages}
          presentation={presentation}
          ref={messageListRef}
        />
      ) : null}
    </AiChatWindowShell>
  )
}
