'use client'

import { Button } from '@heroui/react'
import { useEffect, useRef } from 'react'

function resizeTextarea(element: HTMLTextAreaElement | null) {
  if (!element) {
    return
  }

  element.style.height = '0px'

  const computedStyle = window.getComputedStyle(element)
  const lineHeight = Number.parseFloat(computedStyle.lineHeight || '24') || 24
  const paddingTop = Number.parseFloat(computedStyle.paddingTop || '0') || 0
  const paddingBottom = Number.parseFloat(computedStyle.paddingBottom || '0') || 0
  const borderTop = Number.parseFloat(computedStyle.borderTopWidth || '0') || 0
  const borderBottom = Number.parseFloat(computedStyle.borderBottomWidth || '0') || 0
  const maxHeight = lineHeight * 3 + paddingTop + paddingBottom + borderTop + borderBottom
  const nextHeight = Math.min(element.scrollHeight, maxHeight)

  element.style.height = `${nextHeight}px`
}

export function AiChatComposer({
  isRetryAvailable,
  isStreaming,
  locale,
  onCancel,
  onChange,
  onSend,
  value,
}: {
  isRetryAvailable?: boolean
  isStreaming: boolean
  locale: 'zh' | 'en'
  onCancel?: () => void | Promise<void>
  onChange: (value: string) => void
  onSend: () => void | Promise<void>
  value: string
}) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    resizeTextarea(textareaRef.current)
  }, [value])

  return (
    <div className="grid w-full gap-3">
      <textarea
        className="min-h-[5.5rem] w-full resize-none rounded-xl border border-zinc-200/80 bg-zinc-50/90 px-4 py-3 text-sm leading-6 text-zinc-900 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-2 focus:ring-sky-200/70 dark:border-zinc-800 dark:bg-zinc-900/90 dark:text-zinc-100 dark:focus:border-sky-400/40 dark:focus:bg-zinc-950 dark:focus:ring-sky-400/20"
        onChange={(event) => onChange(event.target.value)}
        onInput={(event) => resizeTextarea(event.currentTarget)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
            event.preventDefault()
            if (!isStreaming && value.trim()) {
              void onSend()
            }
          }
          // Ctrl+Enter / Shift+Enter 自然换行，不做拦截
        }}
        placeholder={
          locale === 'en'
            ? 'Ask about projects, work experience, skills, or role fit.'
            : '请提问项目经历、工作经历、技术栈或岗位匹配相关问题。'
        }
        ref={textareaRef}
        rows={2}
        value={value}
      />
      <div className="flex w-full items-end justify-between gap-3">
        <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">
          {isStreaming
            ? locale === 'en'
              ? 'Generating now. You can stop and retry after the stream settles.'
              : '正在生成中，可先停止本次流式回答，收敛后再重试。'
            : locale === 'en'
              ? `Enter to send, Ctrl+Enter to break line. 20 questions per day${isRetryAvailable ? ', retry available.' : '.'}`
              : `Enter 发送，Ctrl+Enter 换行。每日 20 次提问${isRetryAvailable ? '，可重试上一条。' : '。'}`}
        </p>
        <div className="flex shrink-0 items-center gap-2">
          {isStreaming ? (
            <Button onPress={() => void onCancel?.()} variant="outline">
              {locale === 'en' ? 'Stop' : '停止'}
            </Button>
          ) : null}
          <Button
            className="shrink-0"
            isDisabled={!value.trim() || isStreaming}
            onPress={() => void onSend()}
            variant="primary">
            {isStreaming
              ? locale === 'en'
                ? 'Sending...'
                : '发送中...'
              : locale === 'en'
                ? 'Send'
                : '发送'}
          </Button>
        </div>
      </div>
    </div>
  )
}
