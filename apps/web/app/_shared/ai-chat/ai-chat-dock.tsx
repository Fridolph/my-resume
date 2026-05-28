'use client'

import { Button, Chip } from '@heroui/react'

import { useAiChat } from './ai-chat-context'

export function AiChatDock({ locale }: { locale: 'zh' | 'en' }) {
  const { drawerState, restoreDrawer, session, summaryPreview, view } = useAiChat()

  if (drawerState !== 'minimized') {
    return null
  }

  const statusText =
    view === 'closed'
      ? locale === 'en'
        ? 'Closed'
        : '已结束'
      : view === 'chat'
        ? locale === 'en'
          ? `Turns ${session?.turnCount ?? 0}/20`
          : `已提问 ${session?.turnCount ?? 0}/20`
        : view === 'loading'
          ? locale === 'en'
            ? 'Starting'
            : '启动中'
      : locale === 'en'
          ? 'Starting'
          : '启动中'

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[70]">
      <Button
        aria-label={locale === 'en' ? 'Restore AI chat drawer' : '恢复 AI 对话抽屉'}
        className="pointer-events-auto h-auto min-w-[15rem] rounded-[1.5rem] border border-zinc-200/80 bg-white/92 px-3 py-3 shadow-[0_22px_60px_rgba(15,23,42,0.16)] backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90"
        onPress={restoreDrawer}
        variant="ghost">
        <div className="flex w-full items-center gap-3 text-left">
          <div className="relative flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.22),transparent_56%),linear-gradient(135deg,rgba(15,23,42,0.96),rgba(37,99,235,0.92))] text-[0.68rem] font-black uppercase tracking-[0.18em] text-white">
            AI
            <span className="absolute -right-0.5 -top-0.5 size-3 rounded-full border-2 border-white bg-emerald-400 dark:border-zinc-950" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-semibold tracking-[-0.03em] text-zinc-950 dark:text-white">
                {locale === 'en' ? 'Talk with me' : '和我聊聊'}
              </span>
              <Chip size="sm" variant="soft">
                {statusText}
              </Chip>
            </div>
            <p className="truncate text-xs leading-5 text-zinc-500 dark:text-zinc-400">
              {summaryPreview
                ? summaryPreview.summary
                : view === 'loading'
                  ? locale === 'en'
                    ? 'Preparing today’s chat session'
                    : '正在准备今天的对话会话'
                  : locale === 'en'
                    ? 'Resume-grounded conversation in progress'
                    : '基于简历内容的对话进行中'}
            </p>
          </div>
        </div>
      </Button>
    </div>
  )
}
