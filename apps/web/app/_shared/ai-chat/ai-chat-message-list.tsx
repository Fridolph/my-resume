'use client'

import { Chip, Spinner } from '@heroui/react'
import { Avatar } from '@heroui/react/avatar'
import { Fragment } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import type { AiChatMessage, AiChatMessageBlock, RagAskCitation } from '@my-resume/api-client'

import { RagCitationTooltip } from './rag-citation-tooltip'
import type { AiChatPresentation } from './ai-chat.types'

/**
 * AI 聊天中使用的轻量 Markdown 组件。
 *
 * [#1] 引用标记被 markdown 解析为链接引用而非文本，因此先预处理替换为
 * 安全 sentinel 字符串，再在 text handler 中反向替换为 tooltip 组件。
 */
function ChatMarkdown({
  children,
  citations,
}: {
  children: string
  citations: RagAskCitation[]
}) {
  const citationByIdx = new Map<string, RagAskCitation>()

  for (const citation of citations) {
    citationByIdx.set(citation.ref, citation)
  }

  // 预处理：替换 [#1] → CITATION_1_N 避免被 markdown 解析吃掉
  const processed = children.replace(
    /\[#(\d{1,3})\]/g,
    (_match, num) => `CITATION_${num}_N`,
  )

  return (
    <Markdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children: headingChildren }) => <h3 className="mb-1 mt-3 text-sm font-semibold text-zinc-900 first:mt-0 dark:text-zinc-100">{headingChildren}</h3>,
        h2: ({ children: headingChildren }) => <h3 className="mb-1 mt-3 text-sm font-semibold text-zinc-900 first:mt-0 dark:text-zinc-100">{headingChildren}</h3>,
        h3: ({ children: headingChildren }) => <h4 className="mb-1 mt-2 text-sm font-semibold text-zinc-900 first:mt-0 dark:text-zinc-100">{headingChildren}</h4>,
        a: (props) => (
          <a
            className="text-blue-600 underline decoration-blue-300 underline-offset-2 hover:text-blue-700 dark:text-blue-400 dark:decoration-blue-500/30"
            rel="noreferrer"
            target="_blank"
            {...props}
          />
        ),
        img: (props) => (
          <img
            alt={props.alt ?? ''}
            className="my-2 max-h-48 max-w-full rounded-xl object-contain"
            src={props.src}
          />
        ),
        ul: ({ children: listChildren }) => <ul className="my-1 list-disc pl-4 text-sm">{listChildren}</ul>,
        ol: ({ children: listChildren }) => <ol className="my-1 list-decimal pl-4 text-sm">{listChildren}</ol>,
        code: (props) => {
          const isInline = !props.className
          return isInline ? (
            <code className="rounded-md bg-zinc-100 px-1.5 py-px font-mono text-[0.82rem] text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">{props.children}</code>
          ) : (
            <pre className="my-2 overflow-x-auto rounded-xl bg-zinc-100 p-3 font-mono text-[0.8rem] leading-5 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
              <code {...props} />
            </pre>
          )
        },
        p: ({ children: paraChildren }) => <p className="text-sm leading-6">{paraChildren}</p>,
        blockquote: ({ children: quoteChildren }) => (
          <blockquote className="my-1 border-l-2 border-zinc-300 pl-3 italic text-zinc-500 dark:border-zinc-600 dark:text-zinc-400">{quoteChildren}</blockquote>
        ),
        // 文本节点中检测 CITATION_n_N sentinel，替换为 tooltip
        text: ({ children: textChildren, key }) => {
          const text = String(textChildren)
          const sentinelRegex = /CITATION_(\d{1,3})_N/g
          const segments: Array<{ type: 'text' | 'citation'; value: string; citation?: RagAskCitation }> = []
          let lastIndex = 0
          let m: RegExpExecArray | null

          while ((m = sentinelRegex.exec(text)) !== null) {
            if (m.index > lastIndex) {
              segments.push({ type: 'text', value: text.slice(lastIndex, m.index) })
            }
            const ref = `#${m[1]}`
            const citation = citationByIdx.get(ref)
            segments.push({ type: 'citation', value: ref, citation })
            lastIndex = m.index + m[0].length
          }

          if (lastIndex < text.length) {
            segments.push({ type: 'text', value: text.slice(lastIndex) })
          }

          if (segments.length === 0) {
            return <>{text}</>
          }

          return (
            <Fragment key={key}>
              {segments.map((seg, i) => {
                if (seg.type === 'citation' && seg.citation) {
                  return <RagCitationTooltip citation={seg.citation} key={i} />
                }
                return <Fragment key={i}>{seg.value}</Fragment>
              })}
            </Fragment>
          )
        },
      }}>
      {processed}
    </Markdown>
  )
}

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
    <div className={`relative shrink-0 ${align === 'right' ? 'items-end' : 'items-start'}`}>
      <Avatar.Root
        aria-hidden="true"
        className={[
          'size-7 overflow-hidden rounded-xl border text-xs font-semibold',
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
      <span className="absolute top-7 whitespace-nowrap text-[0.62rem] font-medium uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
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
    <div className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser ? (
        <ChatAvatar
          align="left"
          imageSrc={presentation.assistantAvatarSrc}
          label={assistantLabel}
          variant="assistant"
        />
      ) : null}
      <div className={`grid max-w-[82%] gap-1.5 ${isUser ? 'justify-items-end' : 'justify-items-start'}`}>
        <div
          className={[
            'w-full rounded-lg px-3 py-2 text-sm leading-6',
            isUser
              ? 'rounded-br bg-slate-950 text-white dark:bg-white dark:text-slate-950'
              : 'rounded-bl border border-zinc-200/80 bg-white text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100',
          ].join(' ')}>
          <p className="whitespace-pre-wrap">
            <ChatMarkdown citations={message.citations}>
              {message.content}
            </ChatMarkdown>
          </p>
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
    <div className="grid min-h-0 flex-1 content-start gap-3 overflow-y-auto pr-1">
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
