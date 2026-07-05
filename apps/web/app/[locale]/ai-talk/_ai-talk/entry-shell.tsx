'use client'

import { Card, CardContent } from '@heroui/react/card'
import { Chip } from '@heroui/react/chip'
import { useTranslations } from 'next-intl'

import type {
  ResumeLocale,
  ResumePublishedSnapshot,
} from '@shared/published-resume/types/published-resume.types'
import { readLocalizedText } from '@shared/published-resume/published-resume-utils'
import { RouteCtaButton } from '@shared/site/route-cta-button'
import { AiTalkPageFrame } from './page-frame'
import './entry-shell.css'

interface AiTalkEntryShellProps {
  apiBaseUrl?: string
  enableClientSync?: boolean
  initialLoadError?: string | null
  locale?: ResumeLocale
  publishedResume: ResumePublishedSnapshot | null
}

export function AiTalkEntryShell({
  apiBaseUrl,
  enableClientSync = false,
  initialLoadError = null,
  locale = 'zh',
  publishedResume,
}: AiTalkEntryShellProps) {
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
        const featureCards = [
          { key: 'rag', href: '/ai-talk/chat', ctaVariant: 'primary' as const },
          { key: 'resumeAdvisor', href: '/ai-talk/resume-advisor', ctaVariant: 'ghost' as const },
          { key: 'avatar', href: '/ai-talk/avatar', ctaVariant: 'ghost' as const },
        ] as const

        return (
          <>
            {/* ── Hub Row ── */}
            <Card className="hub-row" data-testid="ai-talk-hub-row">
              <CardContent className="grid gap-6 p-6 md:p-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-stretch lg:auto-rows-fr">
                <div className="grid gap-4 lg:grid-rows-[auto_auto_1fr] lg:content-stretch" data-testid="ai-talk-hub-primary">
                  <div className="grid gap-3">
                    <p className="web-eyebrow">{t('hubRow.eyebrow')}</p>
                    <h1 className="text-3xl font-semibold tracking-[-0.05em] text-slate-950 dark:text-white md:text-4xl">
                      {t('hubRow.title')}
                    </h1>
                    <p className="max-w-3xl text-base leading-7 text-slate-500 dark:text-slate-400">
                      {t('hubRow.description')}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Chip color="accent" variant="primary">{t('status.rag')}</Chip>
                    <Chip variant="soft">{t('status.streaming')}</Chip>
                    <Chip variant="soft">{t('status.trialCode')}</Chip>
                  </div>

                  <ol className="grid gap-[0.85rem] list-none m-0 p-0">
                    {[1, 2, 3].map((index) => (
                      <li className="plan-item" key={index}>
                        <span className="inline-flex w-8 h-8 shrink-0 items-center justify-center rounded-full bg-blue-600/10 text-blue-600 text-sm font-bold dark:bg-blue-400/10 dark:text-blue-400">
                          {index}
                        </span>
                        <div className="grid gap-1">
                          <p className="text-sm font-semibold text-slate-950 dark:text-white">
                            {t(`hubRow.plan.${index}.title`)}
                          </p>
                          <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
                            {t(`hubRow.plan.${index}.description`)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>

                <aside className="profile-panel" data-testid="ai-talk-hub-profile">
                  <div className="grid gap-2">
                    <p className="web-eyebrow">{t('hubRow.profile.eyebrow')}</p>
                    <h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950 dark:text-white">
                      {readLocalizedText(profile.fullName, locale)}
                    </h2>
                    <p className="text-base font-medium text-slate-600 dark:text-slate-300">
                      {readLocalizedText(profile.headline, locale)}
                    </p>
                    <p className="text-sm leading-7 text-slate-500 dark:text-slate-400">
                      {readLocalizedText(profile.summary, locale)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Chip variant="soft">{readLocalizedText(profile.location, locale)}</Chip>
                    <Chip variant="soft">{profile.email}</Chip>
                  </div>

                  <div className="self-end grid gap-2">
                    <p className="text-sm font-semibold text-slate-950 dark:text-white">
                      {t('hubRow.profile.nextTitle')}
                    </p>
                    <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
                      {t('hubRow.profile.nextDescription')}
                    </p>
                  </div>
                </aside>
              </CardContent>
            </Card>

            {/* ── Feature Grid ── */}
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" data-testid="ai-talk-feature-grid">
              {featureCards.map((card) => (
                <article className="flip-scene" data-testid={`ai-talk-card-${card.key}`} key={card.key}>
                  <div className="flip-inner">
                    {/* Front */}
                    <div className="flip-face flip-front">
                      <span className="card-glare" aria-hidden="true" />
                      <div className="relative grid gap-[0.9rem] p-6">
                        <p className="web-eyebrow">{t(`featureCards.${card.key}.front.eyebrow`)}</p>
                        <h3 className="m-0 text-2xl font-bold tracking-[-0.04em] leading-[1.15] text-slate-950 dark:text-white">
                          {t(`featureCards.${card.key}.front.title`)}
                        </h3>
                        <p className="m-0 text-base leading-7 text-slate-500 dark:text-slate-400">
                          {t(`featureCards.${card.key}.front.description`)}
                        </p>
                      </div>
                      <div className="relative flex flex-wrap gap-3 mt-auto px-6 pb-6">
                        <Chip color={card.key === 'rag' ? 'accent' : 'default'} variant="soft">
                          {t(`featureCards.${card.key}.front.badge`)}
                        </Chip>
                        <Chip variant="soft">{t(`featureCards.${card.key}.front.status`)}</Chip>
                      </div>
                    </div>

                    {/* Back */}
                    <div className="flip-face flip-back">
                      <span className="card-glare" aria-hidden="true" />
                      <div className="relative z-[1] grid gap-[0.875rem] h-full grid-rows-[auto_auto_1fr_auto] p-[1.35rem] max-md:p-5">
                        <div className="grid gap-[0.7rem]">
                          <p className="web-eyebrow">{t(`featureCards.${card.key}.back.eyebrow`)}</p>
                          <h3 className="m-0 text-2xl font-bold tracking-[-0.04em] leading-[1.15] text-slate-950 dark:text-white">
                            {t(`featureCards.${card.key}.back.title`)}
                          </h3>
                          <p className="m-0 text-base leading-7 text-slate-500 dark:text-slate-400 max-md:text-[0.95rem] max-md:leading-[1.65]">
                            {t(`featureCards.${card.key}.back.description`)}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          {['one', 'two'].map((item) => (
                            <Chip key={item} variant="soft">{t(`featureCards.${card.key}.back.tags.${item}`)}</Chip>
                          ))}
                        </div>

                        <ul className="detail-list">
                          {['one', 'two'].map((item) => (
                            <li className="detail-item" key={item}>
                              {t(`featureCards.${card.key}.back.details.${item}`)}
                            </li>
                          ))}
                        </ul>

                        <div className="flex flex-wrap items-center gap-3 mt-auto pt-[0.15rem]">
                          <RouteCtaButton href={card.href} tone={card.ctaVariant}>
                            {t(`featureCards.${card.key}.back.cta`)}
                          </RouteCtaButton>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )
      }}
    </AiTalkPageFrame>
  )
}
