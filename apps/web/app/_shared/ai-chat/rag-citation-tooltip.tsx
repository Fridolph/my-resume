'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { RagAskCitation } from '@my-resume/api-client'

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
  const colorClass = SOURCE_COLORS[citation.sourceType] ?? SOURCE_COLORS.default
  const sourceLabel = SOURCE_LABELS[citation.sourceType] ?? citation.sourceType
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isVisible || typeof window === 'undefined') {
      return
    }

    const updatePosition = () => {
      const trigger = triggerRef.current
      if (!trigger) {
        return
      }

      const rect = trigger.getBoundingClientRect()
      const nextLeft = Math.min(
        Math.max(rect.left + rect.width / 2, 16),
        window.innerWidth - 16,
      )
      const nextTop = Math.max(rect.top - 10, 16)

      setPosition({ left: nextLeft, top: nextTop })
    }

    updatePosition()

    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)

    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [isVisible])

  const tooltip =
    isMounted && isVisible && position
      ? createPortal(
          <div
            aria-label={`${sourceLabel} ${citation.title}`}
            className="pointer-events-none fixed z-[80] min-w-[340px] max-w-[min(calc(100vw-32px),480px)] -translate-x-1/2 rounded-xl border border-zinc-200/80 bg-white px-3 py-2 text-left shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
            role="tooltip"
            style={{
              left: `${position.left}px`,
              top: `${position.top}px`,
              transform: 'translate(-50%, -100%)',
            }}>
            <div className="grid gap-1.5">
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
              <strong className="text-xs leading-5 text-zinc-900 dark:text-zinc-100">
                {citation.title}
              </strong>
              {citation.tags && citation.tags.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {citation.tags.map((tag) => (
                    <span
                      className="rounded-full bg-zinc-100 px-1.5 py-px text-[0.55rem] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                      key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
              {citation.snippet ? (
                <p className="line-clamp-6 whitespace-pre-wrap text-[0.7rem] leading-[1.15rem] text-zinc-500 dark:text-zinc-400">
                  {citation.snippet}
                </p>
              ) : null}
            </div>
          </div>,
          document.body,
        )
      : null

  return (
    <>
      <button
        ref={triggerRef}
        aria-label={citation.ref}
        className={[
          'inline-flex cursor-help rounded-md px-1 py-px text-[0.7rem] font-medium transition-colors',
          colorClass,
        ].join(' ')}
        onBlur={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        type="button">
        {citation.ref}
      </button>
      {tooltip}
    </>
  )
}
