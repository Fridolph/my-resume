'use client'

import { Button } from '@heroui/react/button'
import { Chip } from '@heroui/react/chip'
import { useTranslations } from 'next-intl'

import type {
  ResumeLocale,
  ResumePublishedSnapshot,
} from '@shared/published-resume/types/published-resume.types'
import { readLocalizedText } from '@shared/published-resume/published-resume-utils'
import {
  displayCardSurfaceClass,
  displayInsetSurfaceClass,
  interactiveInsetSurfaceClass,
} from '@shared/site/card-surface'
import { RouteCtaButton } from '@shared/site/route-cta-button'
import { AiTalkPageFrame } from '../../_ai-talk/page-frame'

const TOPIC_KEYS = [
  'profile',
  'latestProject',
  'stack',
  'aiPractice',
  'ragAgent',
  'engineering',
  'collaboration',
  'hobbies',
  'writing',
  'future',
] as const

interface AiTalkIntroShellProps {
  apiBaseUrl?: string
  enableClientSync?: boolean
  initialLoadError?: string | null
  locale?: ResumeLocale
  publishedResume: ResumePublishedSnapshot | null
}

export function AiTalkIntroShell({
  apiBaseUrl,
  enableClientSync = false,
  initialLoadError = null,
  locale = 'zh',
  publishedResume,
}: AiTalkIntroShellProps) {
  const t = useTranslations('aiTalk')

  return (
    <AiTalkPageFrame
      apiBaseUrl={apiBaseUrl}
      enableClientSync={enableClientSync}
      initialLoadError={initialLoadError}
      locale={locale}
      publishedResume={publishedResume}>
      {({ publishedResume: snapshot }) => {
        const profile = snapshot.resume.profile
        const fullName = readLocalizedText(profile.fullName, locale)
        const headline = readLocalizedText(profile.headline, locale)

        return (
          <div className="grid gap-6">
            <section
              className="grid gap-6 lg:grid-cols-[minmax(0,1.12fr)_minmax(320px,0.88fr)]"
              data-testid="ai-talk-intro-shell">
              <div className={`${displayCardSurfaceClass} overflow-hidden rounded-[1.75rem]`}>
                <div className="grid gap-6 p-5 sm:p-6 lg:p-8">
                  <div className="grid gap-3">
                    <p className="web-eyebrow">{t('introPage.eyebrow')}</p>
                    <h1 className="max-w-3xl text-3xl font-semibold text-slate-950 dark:text-white md:text-4xl">
                      {t('introPage.title', { name: fullName })}
                    </h1>
                    <p className="max-w-3xl text-base leading-7 text-slate-500 dark:text-slate-400">
                      {t('introPage.description')}
                    </p>
                  </div>

                  <div
                    className="flex max-w-full flex-nowrap items-center gap-3 overflow-x-auto"
                    data-testid="ai-talk-intro-chip-row">
                    <Chip color="accent" size="sm" variant="primary">
                      {t('introPage.badges.guided')}
                    </Chip>
                    <Chip size="sm" variant="soft">
                      {t('introPage.badges.fragments')}
                    </Chip>
                    <Chip size="sm" variant="soft">
                      {headline}
                    </Chip>
                  </div>

                  <div className={`${displayInsetSurfaceClass} grid gap-4 rounded-[1.5rem] p-4`}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="grid gap-1">
                        <p className="text-sm font-semibold text-slate-950 dark:text-white">
                          {t('introPage.chat.title')}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {t('introPage.chat.description')}
                        </p>
                      </div>
                      <Chip size="sm" variant="soft">
                        0 / 10
                      </Chip>
                    </div>

                    <div className="grid gap-3" data-testid="ai-talk-intro-thread-preview">
                      {[1, 2, 3].map((item) => (
                        <div
                          className={[
                            'max-w-[88%] rounded-[1.25rem] px-4 py-3 text-sm leading-6',
                            item === 2
                              ? 'ml-auto bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                              : 'border border-slate-200/80 bg-white/80 text-slate-600 dark:border-slate-700/70 dark:bg-slate-950/70 dark:text-slate-300',
                          ].join(' ')}
                          key={item}>
                          {t(`introPage.chat.messages.${item}`)}
                        </div>
                      ))}
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      {[1, 2].map((item) => (
                        <Button
                          className="justify-start rounded-[1rem]"
                          key={item}
                          size="sm"
                          variant={item === 1 ? 'primary' : 'outline'}>
                          {t(`introPage.chat.promptSamples.${item}`)}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <aside className={`${displayCardSurfaceClass} grid gap-5 rounded-[1.75rem] p-5 sm:p-6 lg:p-8`}>
                <div className="grid gap-3">
                  <p className="web-eyebrow">{t('introPage.unlock.eyebrow')}</p>
                  <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">
                    {t('introPage.unlock.title')}
                  </h2>
                  <p className="text-sm leading-7 text-slate-500 dark:text-slate-400">
                    {t('introPage.unlock.description')}
                  </p>
                </div>

                <div
                  className="grid grid-cols-2 gap-3 sm:grid-cols-5 lg:grid-cols-2 xl:grid-cols-5"
                  data-testid="ai-talk-intro-unlock-grid">
                  {TOPIC_KEYS.map((topic, index) => (
                    <div
                      className={`${interactiveInsetSurfaceClass} aspect-square rounded-[1.25rem] p-3`}
                      key={topic}>
                      <div className="flex h-full flex-col justify-between">
                        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <span className="text-sm font-semibold leading-5 text-slate-700 dark:text-slate-200">
                          {t(`introPage.unlock.topics.${topic}`)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className={`${displayInsetSurfaceClass} rounded-[1.5rem] p-4`}>
                  <p className="text-sm font-semibold text-slate-950 dark:text-white">
                    {t('introPage.unlock.noteTitle')}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    {t('introPage.unlock.noteDescription')}
                  </p>
                </div>
              </aside>
            </section>

            <div className="flex flex-wrap items-center gap-3">
              <RouteCtaButton href="/ai-talk" tone="primary">
                {t('introPage.primaryCta')}
              </RouteCtaButton>
              <RouteCtaButton href="/ai-talk/chat">
                {t('introPage.secondaryCta')}
              </RouteCtaButton>
            </div>
          </div>
        )
      }}
    </AiTalkPageFrame>
  )
}
