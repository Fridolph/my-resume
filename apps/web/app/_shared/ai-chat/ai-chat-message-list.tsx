'use client'

import { Spinner } from '@heroui/react'
import { Avatar } from '@heroui/react/avatar'
import { forwardRef } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import type { AiChatMessage } from '@my-resume/api-client'

import { AiChatAnswerBlockRenderer } from './ai-chat-answer-block-renderer'
import { RagCitationTooltip } from './rag-citation-tooltip'
import type { AiChatPresentation } from './ai-chat.types'

/**
 * 渲染带引用 Tooltip 的消息正文。
 *
 * 先用正则把 [#n] 替换为 「#n」避免被 markdown 吃掉，再用 react-markdown
 * 渲染段落/列表/粗体等，最后把 「#n」 替换为可交互的 RagCitationTooltip。
 */
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
  imageSrc,
  label,
  variant,
}: {
  imageSrc: string | null
  label: string
  variant: 'assistant' | 'visitor'
}) {
  return (
    <Avatar.Root
      aria-hidden="true"
      className={[
        'size-10 shrink-0 overflow-hidden rounded-lg border text-xs font-semibold',
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
  )
}

function AiChatMessageItem({
  locale,
  message,
  presentation,
}: {
  locale: 'zh' | 'en'
  message: AiChatMessage
  presentation: AiChatPresentation
}) {
  const isUser = message.role === 'user'
  const name = isUser ? presentation.visitorLabel : presentation.assistantLabel

  return (
    <div className={`flex items-start gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* 头像 */}
      <ChatAvatar
        imageSrc={isUser ? null : presentation.assistantAvatarSrc}
        label={name}
        variant={isUser ? 'visitor' : 'assistant'}
      />

      {/* 消息列：名字 + 气泡 */}
      <div className={`grid max-w-[82%] gap-0.5 ${isUser ? 'justify-items-end' : 'justify-items-start'}`}>
        {/* 名字 */}
        <span className="px-1 text-[0.72rem] font-medium text-zinc-400 dark:text-zinc-500">
          {name}
        </span>

        {/* 气泡 + 箭头 */}
        <div className="relative">
          {/* 左箭头 (assistant) */}
          {!isUser ? (
            <span
              aria-hidden="true"
              className="absolute left-[-4px] top-3 block size-0
                border-t-[5px] border-t-transparent
                border-r-[6px] border-r-zinc-200/80
                border-b-[5px] border-b-transparent
                dark:border-r-zinc-800"
            />
          ) : null}
          {/* 右箭头 (visitor) */}
          {isUser ? (
            <span
              aria-hidden="true"
              className="absolute right-[-4px] top-3 block size-0
                border-t-[5px] border-t-transparent
                border-l-[6px] border-l-slate-950
                border-b-[5px] border-b-transparent
                dark:border-l-white"
            />
          ) : null}

          <div
            className={[
              'w-full rounded-lg px-3 py-2 text-sm leading-6',
              isUser
                ? 'rounded-br bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                : 'rounded-bl border border-zinc-200/80 bg-white text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100',
            ].join(' ')}>
          <div className="text-sm leading-6">
            <Markdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: (props) => <a className="text-blue-600 underline decoration-blue-300 underline-offset-2 hover:text-blue-700 dark:text-blue-400 dark:decoration-blue-500/30" rel="noreferrer" target="_blank" {...props} />,
                img: (props) => <img alt={props.alt ?? ''} className="my-2 max-h-48 max-w-full rounded-xl object-contain" src={props.src} />,
                code: (props) => props.className ? (
                  <pre className="my-2 overflow-x-auto rounded-xl bg-zinc-100 p-3 font-mono text-[0.8rem] leading-5 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"><code {...props} /></pre>
                ) : (
                  <code className="rounded-md bg-zinc-100 px-1.5 py-px font-mono text-[0.82rem] text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">{props.children}</code>
                ),
                p: ({ children: pChildren }) => <p className="text-sm leading-6">{pChildren}</p>,
                blockquote: ({ children: qChildren }) => <blockquote className="my-1 border-l-2 border-zinc-300 pl-3 italic text-zinc-500 dark:border-zinc-600 dark:text-zinc-400">{qChildren}</blockquote>,
              }}>
              {message.content
                // 清洗正文中的引用标记（已在下方独立行展示）
                .replace(/\[#\d{1,3}\]/g, '')
                .replace(/(?<!\w)#\d{1,3}(?!\w)/g, '')
                .replace(/@\d{1,3}@/g, '')}
            </Markdown>
          </div>
        </div>
        </div>

        {/* AI 引用来源 */}
        {!isUser && message.citations.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1 px-1">
            <span className="text-[0.62rem] text-zinc-400 dark:text-zinc-500">引用：</span>
            {message.citations.map((citation) => (
              <RagCitationTooltip citation={citation} key={citation.ref} />
            ))}
          </div>
        ) : null}

        {!isUser && message.answerBlocks.length > 0 ? (
          <AiChatAnswerBlockRenderer blocks={message.answerBlocks} locale={locale} />
        ) : null}
      </div>
    </div>
  )
}

export const AiChatMessageList = forwardRef<HTMLDivElement, {
  isStreaming: boolean
  locale: 'zh' | 'en'
  messages: AiChatMessage[]
  presentation: AiChatPresentation
}>(function AiChatMessageList({
  isStreaming,
  locale,
  messages,
  presentation,
}, ref) {
  return (
    <div className="grid min-h-0 flex-1 content-start gap-3 overflow-y-auto pr-1" ref={ref}>
      {messages.map((message) => (
        <AiChatMessageItem
          key={message.id}
          locale={locale}
          message={message}
          presentation={presentation}
        />
      ))}
      {isStreaming ? (
        <div className="inline-flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          <Spinner size="sm" />
          {locale === 'en' ? 'Generating answer...' : '正在生成回答...'}
        </div>
      ) : null}
    </div>
  )
})
