'use client'

import { Chip } from '@heroui/react/chip'
import { useTranslations } from 'next-intl'

import {
  displayCardSurfaceClass,
  displayInsetSurfaceClass,
  interactiveInsetSurfaceClass,
} from '@shared/site/card-surface'
import { INTRO_TOPIC_KEYS } from './intro-topic-config'
import type { IntroTopicKey, IntroUnlockMapProps } from './types/intro-shell.types'

function getLatestCompletedTopic(completedTopics: IntroTopicKey[]) {
  return completedTopics.length > 0 ? completedTopics[completedTopics.length - 1] : null
}

export function IntroUnlockMap({
  completedTopics,
  heroImageUrl,
}: IntroUnlockMapProps) {
  const t = useTranslations('aiTalk')
  const completedTopicSet = new Set(completedTopics)
  const latestCompletedTopic = getLatestCompletedTopic(completedTopics)
  const completedCount = completedTopics.length
  const totalCount = INTRO_TOPIC_KEYS.length
  const progressPercent = Math.round((completedCount / totalCount) * 100)
  const isComplete = completedCount === totalCount

  return (
    <aside
      className={`${displayCardSurfaceClass} grid gap-5 overflow-hidden rounded-[1.75rem] p-5 sm:p-6 lg:p-8`}
      data-testid="ai-talk-intro-unlock-map">
      <div className="grid gap-3">
        <p className="web-eyebrow">{t('introPage.unlock.eyebrow')}</p>
        <div className="flex items-start justify-between gap-3">
          <div className="grid gap-2">
            <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">
              {t('introPage.unlock.title')}
            </h2>
            <p className="text-sm leading-7 text-slate-500 dark:text-slate-400">
              {t('introPage.unlock.description')}
            </p>
          </div>
          <Chip color={isComplete ? 'success' : 'accent'} size="sm" variant="primary">
            {progressPercent}%
          </Chip>
        </div>
      </div>

      <div className={`${displayInsetSurfaceClass} overflow-hidden rounded-[1.5rem]`}>
        <div
          className="relative grid min-h-36 content-end overflow-hidden p-4"
          data-testid="ai-talk-intro-portrait-preview">
          {heroImageUrl ? (
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-cover bg-center opacity-35 grayscale transition duration-500 data-[complete=true]:opacity-55 data-[complete=true]:grayscale-0"
              data-complete={isComplete}
              style={{ backgroundImage: `url(${heroImageUrl})` }}
            />
          ) : null}
          <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(14,165,233,0.28),rgba(16,185,129,0.22))]" />
          <div className="relative grid gap-2 text-white">
            <p className="text-sm font-semibold">{t('introPage.unlock.progressTitle')}</p>
            <div
              aria-label={t('introPage.unlock.progressAria', {
                completed: String(completedCount),
                total: String(totalCount),
              })}
              className="h-2 overflow-hidden rounded-full bg-white/20"
              role="progressbar"
              aria-valuemax={totalCount}
              aria-valuemin={0}
              aria-valuenow={completedCount}>
              <div
                className="h-full rounded-full bg-emerald-300 transition-[width] duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-white/75">
              {t('introPage.unlock.progressText', {
                completed: String(completedCount),
                total: String(totalCount),
              })}
            </p>
          </div>
        </div>
      </div>

      <div
        className="grid grid-cols-2 gap-3 sm:grid-cols-5 lg:grid-cols-2 xl:grid-cols-5"
        data-testid="ai-talk-intro-unlock-grid">
        {INTRO_TOPIC_KEYS.map((topic, index) => {
          const isUnlocked = completedTopicSet.has(topic)

          return (
            <div
              className={[
                interactiveInsetSurfaceClass,
                'aspect-square rounded-[1.25rem] p-3 transition duration-300',
                isUnlocked
                  ? 'border-emerald-200/80 bg-emerald-50/80 shadow-[0_18px_42px_rgba(16,185,129,0.16)] dark:border-emerald-400/25 dark:bg-emerald-500/10'
                  : 'opacity-60 grayscale',
              ].join(' ')}
              data-state={isUnlocked ? 'completed' : 'locked'}
              data-testid={`ai-talk-intro-fragment-${topic}`}
              key={topic}>
              <div className="flex h-full flex-col justify-between">
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="grid gap-1">
                  <span className="text-sm font-semibold leading-5 text-slate-700 dark:text-slate-200">
                    {t(`introPage.unlock.topics.${topic}`)}
                  </span>
                  <span className="text-[0.68rem] font-medium text-emerald-600 opacity-0 transition dark:text-emerald-300 data-[visible=true]:opacity-100" data-visible={isUnlocked}>
                    {t(`introPage.unlock.keywords.${topic}`)}
                  </span>
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <div className={`${displayInsetSurfaceClass} rounded-[1.5rem] p-4`} data-testid="ai-talk-intro-unlock-detail">
        {isComplete ? (
          <>
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              {t('introPage.unlock.completeTitle')}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              {t('introPage.unlock.completeDescription')}
            </p>
          </>
        ) : latestCompletedTopic ? (
          <>
            <p className="text-sm font-semibold text-slate-950 dark:text-white">
              {t(`introPage.unlock.topics.${latestCompletedTopic}`)}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              {t(`introPage.unlock.summaries.${latestCompletedTopic}`)}
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold text-slate-950 dark:text-white">
              {t('introPage.unlock.noteTitle')}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              {t('introPage.unlock.noteDescription')}
            </p>
          </>
        )}
      </div>
    </aside>
  )
}
