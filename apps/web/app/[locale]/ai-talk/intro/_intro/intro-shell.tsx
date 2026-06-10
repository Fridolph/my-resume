'use client'

import { Button } from '@heroui/react/button'
import { Chip } from '@heroui/react/chip'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'

import { readLocalizedText } from '@shared/published-resume/published-resume-utils'
import {
  displayCardSurfaceClass,
  displayInsetSurfaceClass,
} from '@shared/site/card-surface'
import { RouteCtaButton } from '@shared/site/route-cta-button'
import { AiTalkPageFrame } from '../../_ai-talk/page-frame'
import { INTRO_TOPIC_KEYS } from './intro-topic-config'
import { IntroUnlockMap } from './intro-unlock-map'
import type {
  AiTalkIntroShellProps,
  IntroThreadMessage,
  IntroTopicKey,
  ResumeLocale,
} from './types/intro-shell.types'

const INTRO_PROGRESS_STORAGE_PREFIX = 'my-resume:ai-intro:v1'

function isIntroTopicKey(value: unknown): value is IntroTopicKey {
  return typeof value === 'string' && INTRO_TOPIC_KEYS.includes(value as IntroTopicKey)
}

function readStoredCompletedTopics(locale: ResumeLocale): IntroTopicKey[] {
  if (typeof window === 'undefined') return []

  try {
    const rawValue = window.localStorage.getItem(`${INTRO_PROGRESS_STORAGE_PREFIX}:${locale}`)
    if (!rawValue) return []

    const parsed = JSON.parse(rawValue) as { completedTopics?: unknown }
    if (!Array.isArray(parsed.completedTopics)) return []

    return parsed.completedTopics.filter(isIntroTopicKey)
  } catch {
    return []
  }
}

function writeStoredCompletedTopics(locale: ResumeLocale, completedTopics: IntroTopicKey[]) {
  if (typeof window === 'undefined') return

  window.localStorage.setItem(
    `${INTRO_PROGRESS_STORAGE_PREFIX}:${locale}`,
    JSON.stringify({ completedTopics }),
  )
}

export function AiTalkIntroShell({
  apiBaseUrl,
  enableClientSync = false,
  initialLoadError = null,
  locale = 'zh',
  publishedResume,
}: AiTalkIntroShellProps) {
  const t = useTranslations('aiTalk')
  const [completedTopics, setCompletedTopics] = useState<IntroTopicKey[]>([])
  const [hasLoadedProgress, setHasLoadedProgress] = useState(false)

  useEffect(() => {
    setCompletedTopics(readStoredCompletedTopics(locale))
    setHasLoadedProgress(true)
  }, [locale])

  useEffect(() => {
    if (!hasLoadedProgress) return
    writeStoredCompletedTopics(locale, completedTopics)
  }, [completedTopics, hasLoadedProgress, locale])

  const completedTopicSet = useMemo(() => new Set(completedTopics), [completedTopics])
  const threadMessages = useMemo<IntroThreadMessage[]>(() => {
    const initialMessages: IntroThreadMessage[] = [
      {
        content: t('introPage.chat.messages.1'),
        id: 'assistant-intro-1',
        role: 'assistant',
      },
      {
        content: t('introPage.chat.messages.2'),
        id: 'assistant-intro-2',
        role: 'assistant',
      },
    ]

    return completedTopics.reduce<IntroThreadMessage[]>((messages, topic) => {
      messages.push({
        content: t(`introPage.questions.${topic}`),
        id: `user-${topic}`,
        role: 'user',
      })
      messages.push({
        content: t(`introPage.answers.${topic}`),
        id: `assistant-${topic}`,
        role: 'assistant',
      })

      return messages
    }, initialMessages)
  }, [completedTopics, t])

  const completeTopic = (topic: IntroTopicKey) => {
    setCompletedTopics((currentTopics) => {
      if (currentTopics.includes(topic)) return currentTopics
      return [...currentTopics, topic]
    })
  }

  const resetProgress = () => {
    setCompletedTopics([])
  }

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
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="grid gap-1">
                        <p className="text-sm font-semibold text-slate-950 dark:text-white">
                          {t('introPage.chat.title')}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {t('introPage.chat.description')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          isDisabled={completedTopics.length === 0}
                          onPress={resetProgress}
                          size="sm"
                          variant="ghost">
                          {t('introPage.chat.resetAction')}
                        </Button>
                        <Chip size="sm" variant="soft">
                          {completedTopics.length} / {INTRO_TOPIC_KEYS.length}
                        </Chip>
                      </div>
                    </div>

                    <div className="grid gap-3" data-testid="ai-talk-intro-thread-preview">
                      {threadMessages.map((message) => (
                        <div
                          className={[
                            'max-w-[88%] rounded-[1.25rem] px-4 py-3 text-sm leading-6',
                            message.role === 'user'
                              ? 'ml-auto bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                              : 'border border-slate-200/80 bg-white/80 text-slate-600 dark:border-slate-700/70 dark:bg-slate-950/70 dark:text-slate-300',
                          ].join(' ')}
                          key={message.id}>
                          {message.content}
                        </div>
                      ))}
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2" data-testid="ai-talk-intro-question-list">
                      {INTRO_TOPIC_KEYS.map((topic) => {
                        const isCompleted = completedTopicSet.has(topic)

                        return (
                          <Button
                            className="justify-start rounded-[1rem] text-left"
                            isDisabled={isCompleted}
                            key={topic}
                            onPress={() => completeTopic(topic)}
                            size="sm"
                            variant={isCompleted ? 'ghost' : 'outline'}>
                            {t(`introPage.questions.${topic}`)}
                          </Button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <IntroUnlockMap
                completedTopics={completedTopics}
                heroImageUrl={profile.hero.frontImageUrl}
              />
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
