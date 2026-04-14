'use client'

import { useTranslations } from 'next-intl'

import type {
  ResumeHighlightItem,
  ResumeLocale,
} from '@shared/published-resume/types/published-resume.types'
import { readLocalizedText } from '@shared/published-resume/published-resume-utils'

interface PublishedResumeHighlightsSectionProps {
  locale: ResumeLocale
  highlights: ResumeHighlightItem[]
}

type HighlightPresetKey =
  | 'frontend'
  | 'fullStack'
  | 'aiOps'
  | 'quality'
  | 'teamwork'
  | 'writing'

interface HighlightSignalPreset {
  accentClassName: string
  key: HighlightPresetKey
  keywords: string[]
}

const highlightSignalPresets: HighlightSignalPreset[] = [
  {
    accentClassName:
      'from-sky-500/18 via-cyan-500/12 to-transparent dark:from-sky-400/18 dark:via-cyan-400/10',
    key: 'frontend',
    keywords: ['前端', 'frontend', 'ui', 'design system', '组件', 'web'],
  },
  {
    accentClassName:
      'from-emerald-500/18 via-teal-500/10 to-transparent dark:from-emerald-400/18 dark:via-teal-400/10',
    key: 'fullStack',
    keywords: ['全栈', 'full-stack', 'node', 'nest', 'server', '交付'],
  },
  {
    accentClassName:
      'from-fuchsia-500/16 via-indigo-500/10 to-transparent dark:from-fuchsia-400/18 dark:via-indigo-400/10',
    key: 'aiOps',
    keywords: ['ai', 'rag', '智能', 'analysis', 'prompt', 'automation'],
  },
  {
    accentClassName:
      'from-amber-500/18 via-orange-500/10 to-transparent dark:from-amber-400/18 dark:via-orange-400/12',
    key: 'quality',
    keywords: ['测试', '质量', 'review', '工程化', 'performance', '性能', 'ci'],
  },
  {
    accentClassName:
      'from-rose-500/16 via-pink-500/10 to-transparent dark:from-rose-400/18 dark:via-pink-400/10',
    key: 'teamwork',
    keywords: ['团队', '协作', 'lead', '分享', '管理', '沟通'],
  },
  {
    accentClassName:
      'from-violet-500/16 via-slate-500/10 to-transparent dark:from-violet-400/18 dark:via-slate-400/12',
    key: 'writing',
    keywords: ['写作', '博客', '文章', '开源', 'open source', 'tutorial', '分享'],
  },
]

function resolveHighlightSignal(
  item: ResumeHighlightItem,
  index: number,
  t: ReturnType<typeof useTranslations>,
) {
  const normalizedText =
    `${item.title.zh} ${item.title.en} ${item.description.zh} ${item.description.en}`.toLowerCase()
  const preset =
    highlightSignalPresets.find((candidate) =>
      candidate.keywords.some((keyword) =>
        normalizedText.includes(keyword.toLowerCase()),
      ),
    ) ?? highlightSignalPresets[index % highlightSignalPresets.length]

  return {
    accentClassName: preset.accentClassName,
    badge: t(`highlights.presets.${preset.key}.badge`),
    tags: [
      t(`highlights.presets.${preset.key}.tags.one`),
      t(`highlights.presets.${preset.key}.tags.two`),
      t(`highlights.presets.${preset.key}.tags.three`),
    ],
  }
}

export function PublishedResumeHighlightsSection({
  locale,
  highlights,
}: PublishedResumeHighlightsSectionProps) {
  const t = useTranslations('publishedResume')

  if (highlights.length === 0) {
    return null
  }

  const signalSummary = Array.from(
    new Set(highlights.map((item, index) => resolveHighlightSignal(item, index, t).badge)),
  ).slice(0, 4)

  return (
    <section className="relative overflow-hidden rounded-[32px] border border-white/65 bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.1),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(186,230,253,0.07),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.86),rgba(248,250,252,0.8))] px-5 py-6 shadow-[0_28px_80px_rgba(15,23,42,0.08)] dark:border-white/8 dark:bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.12),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.08),transparent_32%),linear-gradient(180deg,rgba(15,23,42,0.88),rgba(15,23,42,0.8))] sm:px-6 lg:px-7">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.1),transparent_52%),radial-gradient(circle_at_top_right,rgba(186,230,253,0.08),transparent_46%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.12),transparent_52%),radial-gradient(circle_at_top_right,rgba(34,211,238,0.08),transparent_48%)]" />

      <div className="relative grid gap-6 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]">
        <div className="space-y-4">
          <div className="space-y-3">
            <p className="web-eyebrow">{t('highlights.eyebrow')}</p>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-[2rem]">
                {t('highlights.title')}
              </h2>
              <p className="max-w-xl text-base leading-7 text-slate-500 dark:text-slate-400">
                {t('highlights.description')}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {signalSummary.map((signal) => (
              <span
                className="inline-flex items-center rounded-full border border-slate-200/80 bg-white/80 px-3 py-1 text-sm font-medium text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                key={signal}>
                {signal}
              </span>
            ))}
          </div>

          <div className="rounded-[24px] border border-slate-200/75 bg-[radial-gradient(circle_at_top_left,rgba(191,219,254,0.24),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.88),rgba(248,250,252,0.8))] px-4 py-4 dark:border-white/8 dark:bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.12),transparent_40%),linear-gradient(180deg,rgba(30,41,59,0.68),rgba(15,23,42,0.54))]">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
              {t('highlights.signalLensTitle')}
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-400">
              {t('highlights.signalLensDescription')}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {highlights.map((item, index) => {
            const signal = resolveHighlightSignal(item, index, t)

            return (
              <article
                className="group relative overflow-hidden rounded-[28px] border border-slate-200/70 bg-[radial-gradient(circle_at_top_left,rgba(191,219,254,0.24),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.9),rgba(248,250,252,0.82))] p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] dark:border-white/8 dark:bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.12),transparent_42%),linear-gradient(180deg,rgba(30,41,59,0.66),rgba(15,23,42,0.52))]"
                key={`${item.title.en}-${item.description.en}-${index}`}>
                <div
                  className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-br ${signal.accentClassName}`}
                />

                <div className="relative flex items-start justify-between gap-3">
                  <span className="inline-flex items-center rounded-full border border-white/70 bg-white/88 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/8 dark:text-slate-200">
                    {signal.badge}
                  </span>
                  <span className="text-xs font-medium text-slate-300 dark:text-slate-600">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>

                <div className="relative mt-5 space-y-3">
                  <h3 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
                    {readLocalizedText(item.title, locale)}
                  </h3>
                  <p className="text-sm leading-7 text-slate-500 dark:text-slate-400">
                    {readLocalizedText(item.description, locale)}
                  </p>
                </div>

                <div className="relative mt-5 flex flex-wrap gap-2">
                  {signal.tags.map((tag) => (
                    <span
                      className="inline-flex items-center rounded-full border border-slate-200/80 bg-white/80 px-3 py-1 text-xs font-medium text-slate-600 dark:border-white/10 dark:bg-white/6 dark:text-slate-200"
                      key={`${item.title.en}-${tag}`}>
                      {tag}
                    </span>
                  ))}
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
