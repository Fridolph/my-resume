'use client'

import { Button, Drawer } from '@heroui/react'
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
  return (
    <Drawer.Backdrop
      className="pointer-events-none"
      isDismissable={false}
      isOpen={isOpen}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onHide()
        }
      }}
      variant="transparent">
      <Drawer.Content className="pointer-events-auto" placement="right">
        <Drawer.Dialog className="!p-0 h-full w-full max-w-[min(100vw,34rem)] rounded-none border-l border-zinc-200/80 bg-white/94 shadow-[-24px_0_80px_rgba(15,23,42,0.14)] backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/92">
          <Drawer.Header className="!mt-0 border-b border-zinc-200/80 px-4 py-3 dark:border-zinc-800">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <Drawer.Heading className="truncate text-lg font-semibold tracking-[-0.04em] text-zinc-950 dark:text-white">
                  {title}
                </Drawer.Heading>
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
          </Drawer.Header>
          <Drawer.Body className="!mt-0 !grid min-h-0 gap-4 px-4 py-4">{children}</Drawer.Body>
          {footer ? (
            <Drawer.Footer className="!mt-0 !block w-full border-t border-zinc-200/80 px-4 py-3 dark:border-zinc-800">
              {footer}
            </Drawer.Footer>
          ) : null}
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  )
}
