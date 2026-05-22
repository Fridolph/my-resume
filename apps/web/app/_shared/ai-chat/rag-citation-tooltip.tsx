'use client'

import { Tooltip } from '@heroui/react'
import type { RagAskCitation } from '@my-resume/api-client'

/**
 * 引用标签颜色映射（按来源类型）。
 */
const SOURCE_COLORS: Record<string, string> = {
  resume_core:
    'bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20',
  user_docs:
    'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20',
  knowledge:
    'bg-violet-50 text-violet-600 hover:bg-violet-100 dark:bg-violet-500/10 dark:text-violet-400 dark:hover:bg-violet-500/20',
  resume:
    'bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/20',
  default:
    'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700',
}

/**
 * 来源类型中文映射。
 */
const SOURCE_LABELS: Record<string, string> = {
  resume_core: '简历核心',
  user_docs: '资料库',
  knowledge: '知识文章',
  resume: '简历',
}

export interface RagCitationTooltipProps {
  citation: RagAskCitation
}

export function RagCitationTooltip({ citation }: RagCitationTooltipProps) {
  const colorClass =
    SOURCE_COLORS[citation.sourceType] ?? SOURCE_COLORS.default
  const sourceLabel = SOURCE_LABELS[citation.sourceType] ?? citation.sourceType

  return (
    <Tooltip delay={400}>
      <Tooltip.Trigger>
        <span
          className={[
            'inline-flex cursor-pointer rounded-md px-1 py-px text-[0.7rem] font-medium transition-colors',
            colorClass,
          ].join(' ')}>
          {citation.ref}
        </span>
      </Tooltip.Trigger>
      <Tooltip.Content
        className="max-w-72 rounded-xl border border-zinc-200/80 bg-white px-3 py-2 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
        offset={8}
        placement="top">
        <div className="grid gap-1.5">
          {/* 来源标签行 */}
          <div className="inline-flex flex-wrap items-center gap-1">
            <span className="rounded-full bg-zinc-100 px-1.5 py-px text-[0.6rem] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              {sourceLabel}
            </span>
            <span className="rounded-full bg-zinc-100 px-1.5 py-px text-[0.6rem] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              {citation.section}
            </span>
            {typeof citation.score === 'number' ? (
              <span className="text-[0.6rem] text-zinc-400 dark:text-zinc-500">
                {citation.score.toFixed(3)}
              </span>
            ) : null}
          </div>
          {/* 标题 */}
          <strong className="text-xs leading-5 text-zinc-900 dark:text-zinc-100">
            {citation.title}
          </strong>
          {/* 正文摘要 */}
          {citation.snippet ? (
            <p className="line-clamp-6 whitespace-pre-wrap text-[0.7rem] leading-[1.15rem] text-zinc-500 dark:text-zinc-400">
              {citation.snippet}
            </p>
          ) : null}
        </div>
      </Tooltip.Content>
    </Tooltip>
  )
}
