'use client'

import { Button } from '@heroui/react'
import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'

function MinimizeIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M6 12h12"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M7 7 17 17M17 7 7 17"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

export function AiChatWindowShell({
  children,
  footer,
  isOpen,
  locale,
  onHide,
  onMinimize,
  status,
  subtitle,
  title,
}: {
  children: ReactNode
  footer?: ReactNode
  isOpen: boolean
  locale: 'zh' | 'en'
  onHide: () => void
  onMinimize: () => void
  status?: ReactNode
  subtitle: string
  title: string
}) {
  if (!isOpen || typeof document === 'undefined') {
    return null
  }

  return createPortal(
    <section
      aria-label={title}
      aria-modal="false"
      className="pointer-events-none fixed inset-x-3 bottom-3 z-[65] grid max-h-[calc(100vh-1.5rem)] md:inset-x-auto md:right-4 md:top-20 md:bottom-4 md:w-[min(34rem,calc(100vw-2rem))] md:max-w-[34rem]"
      role="dialog">
      <div className="pointer-events-auto flex h-full min-h-0 flex-col overflow-hidden rounded-[2rem] border border-zinc-200/80 bg-white/96 shadow-[0_24px_80px_rgba(15,23,42,0.16)] backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/92">
        <header className="border-b border-zinc-200/80 px-4 py-3 dark:border-zinc-800">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-lg font-semibold tracking-[-0.04em] text-zinc-950 dark:text-white">
                {title}
              </h2>
              <p className="mt-1 truncate text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                {subtitle}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {status ? <div className="hidden md:block">{status}</div> : null}
              <Button
                aria-label={locale === 'en' ? 'Minimize AI chat' : '最小化 AI 对话'}
                isIconOnly
                onPress={onMinimize}
                size="sm"
                variant="ghost">
                <MinimizeIcon />
              </Button>
              <Button
                aria-label={locale === 'en' ? 'Close AI chat' : '关闭 AI 对话'}
                isIconOnly
                onPress={onHide}
                size="sm"
                variant="ghost">
                <CloseIcon />
              </Button>
            </div>
          </div>
          {status ? <div className="mt-3 md:hidden">{status}</div> : null}
        </header>

        <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto px-4 py-4">{children}</div>

        {footer ? (
          <footer className="border-t border-zinc-200/80 px-4 py-3 dark:border-zinc-800">
            {footer}
          </footer>
        ) : null}
      </div>
    </section>,
    document.body,
  )
}
