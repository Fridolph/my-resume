'use client'

import { Chip, Spinner } from '@heroui/react'
import { Avatar } from '@heroui/react/avatar'

import type { AiChatMessage, AiChatMessageBlock } from '@my-resume/api-client'
import type { AiChatPresentation } from './ai-chat.types'

function renderMessageBlocks(blocks: AiChatMessageBlock[]) {
  return blocks.map((block, index) => {
    if (block.type === 'project_card' || block.type === 'experience_card') {
      return (
        <article
          className="grid gap-2 rounded-2xl border border-blue-200/70 bg-blue-50/70 p-3 dark:border-blue-500/20 dark:bg-blue-500/10"
          key={`${block.type}-${index}`}>
          <div className="grid gap-0.5">
            <strong className="text-sm text-zinc-950 dark:text-white">{block.title}</strong>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {block.subtitle} · {block.period}
            </span>
          </div>
          <p className="text-sm leading-6 text-zinc-700 dark:text-zinc-200">{block.summary}</p>
          {block.highlights.length > 0 ? (
            <ul className="grid gap-1 text-xs leading-5 text-zinc-600 dark:text-zinc-300">
              {block.highlights.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          ) : null}
        </article>
      )
    }

    if (block.type === 'summary') {
      return (
        <article
          className="grid gap-2 rounded-2xl border border-emerald-200/70 bg-emerald-50/70 p-3 dark:border-emerald-500/20 dark:bg-emerald-500/10"
          key={`${block.type}-${index}`}>
          <strong className="text-sm text-zinc-950 dark:text-white">{block.title}</strong>
          <p className="text-sm leading-6 text-zinc-700 dark:text-zinc-200">{block.summary}</p>
          {block.keywords.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {block.keywords.map((item) => (
                <Chip key={item} size="sm" variant="soft">
                  {item}
                </Chip>
              ))}
            </div>
          ) : null}
        </article>
      )
    }

    if (block.type === 'system_notice') {
      return (
        <div
          className="rounded-2xl border border-amber-200/70 bg-amber-50/70 px-3 py-2 text-sm leading-6 text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100"
          key={`${block.type}-${index}`}>
          {block.text}
        </div>
      )
    }

    // text 类型 block 不重复渲染——消息正文已在气泡中展示
    return null
  })
}

function buildInitials(label: string) {
  const trimmed = label.trim()

  if (!trimmed) {
    return 'AI'
  }

  return trimmed.slice(0, 1).toUpperCase()
}

function VisitorGlyph() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24">
      <path
        d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-6.5 7a6.5 6.5 0 0 1 13 0"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  )
}

function ChatAvatar({
  align,
  imageSrc,
  label,
  variant,
}: {
  align: 'left' | 'right'
  imageSrc: string | null
  label: string
  variant: 'assistant' | 'visitor'
}) {
  return (
    <div className={`relative grid justify-items-center ${align === 'right' ? 'justify-items-end' : 'justify-items-start'}`}>
      <Avatar.Root
        aria-hidden="true"
        className={[
          'size-9 overflow-hidden rounded-2xl border text-sm font-semibold shadow-sm',
          variant === 'assistant'
            ? 'border-sky-200/80 bg-white text-zinc-700 dark:border-sky-400/20 dark:bg-zinc-950 dark:text-zinc-200'
            : 'border-zinc-200/80 bg-slate-950 text-white dark:border-zinc-700 dark:bg-white dark:text-slate-950',
        ].join(' ')}>
        {imageSrc ? (
          <Avatar.Image alt={`${label} avatar`} className="h-full w-full object-cover" src={imageSrc} />
        ) : null}
        <Avatar.Fallback className="flex h-full w-full items-center justify-center">
          {variant === 'assistant' ? buildInitials(label) : <VisitorGlyph />}
        </Avatar.Fallback>
      </Avatar.Root>
      <span className="absolute top-full mt-1 whitespace-nowrap text-[0.68rem] font-medium uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
        {label}
      </span>
    </div>
  )
}

function AiChatMessageItem({
  message,
  presentation,
}: {
  message: AiChatMessage
  presentation: AiChatPresentation
}) {
  const isUser = message.role === 'user'
  const assistantLabel = presentation.assistantLabel
  const visitorLabel = presentation.visitorLabel

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser ? (
        <ChatAvatar
          align="left"
          imageSrc={presentation.assistantAvatarSrc}
          label={assistantLabel}
          variant="assistant"
        />
      ) : null}
      <div className={`grid max-w-[82%] gap-2 ${isUser ? 'justify-items-end' : 'justify-items-start'}`}>
        <div
          className={[
            'w-full rounded-lg px-4 py-3 text-sm leading-6 shadow-sm',
            isUser
              ? 'rounded-br bg-slate-950 text-white dark:bg-white dark:text-slate-950'
              : 'rounded-bl border border-zinc-200/80 bg-white text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100',
          ].join(' ')}>
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
        {!isUser && message.answerBlocks.length > 0 ? (
          <div className="grid w-full gap-2">{renderMessageBlocks(message.answerBlocks)}</div>
        ) : null}
      </div>
      {isUser ? (
        <ChatAvatar align="right" imageSrc={null} label={visitorLabel} variant="visitor" />
      ) : null}
    </div>
  )
}

export function AiChatMessageList({
  isStreaming,
  locale,
  messages,
  presentation,
}: {
  isStreaming: boolean
  locale: 'zh' | 'en'
  messages: AiChatMessage[]
  presentation: AiChatPresentation
}) {
  return (
    <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto pr-1">
      {messages.map((message) => (
        <AiChatMessageItem key={message.id} message={message} presentation={presentation} />
      ))}
      {isStreaming ? (
        <div className="inline-flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          <Spinner size="sm" />
          {locale === 'en' ? 'Generating answer...' : '正在生成回答...'}
        </div>
      ) : null}
    </div>
  )
}
