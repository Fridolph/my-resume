'use client'

import { Button } from '@heroui/react/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@heroui/react/card'
import { Chip } from '@heroui/react/chip'
import { useTranslations } from 'next-intl'

import { DEFAULT_API_BASE_URL } from '@core/env'
import { Link } from '@core/i18n/navigation'
import type {
  ResumeLocale,
  ResumePublishedSnapshot,
} from '@shared/published-resume/types/published-resume.types'
import { PublishedResumeEmptyState } from '@shared/published-resume/published-resume-empty-state'
import { PublishedResumeLoadingState } from '@shared/published-resume/published-resume-loading-state'
import {
  formatPublishedAt,
  readLocalizedText,
} from '@shared/published-resume/published-resume-utils'
import { createFetchPublishedResumeMethod } from '@shared/published-resume/services/published-resume-api'
import { usePublishedResumeSync } from '@shared/published-resume/hooks/use-published-resume-sync'
import { PublicSiteHeader } from '@shared/site/site-header'

interface ProfileOverviewShellProps {
  apiBaseUrl?: string
  createSyncPublishedResumeMethod?: typeof createFetchPublishedResumeMethod
  enableClientSync?: boolean
  locale?: ResumeLocale
  publishedResume: ResumePublishedSnapshot | null
}

export function ProfileOverviewShell({
  apiBaseUrl = DEFAULT_API_BASE_URL,
  createSyncPublishedResumeMethod = createFetchPublishedResumeMethod,
  enableClientSync = false,
  locale = 'zh',
  publishedResume,
}: ProfileOverviewShellProps) {
  const t = useTranslations('profile')
  const { currentPublishedResume, syncState, syncMessage } = usePublishedResumeSync({
    apiBaseUrl,
    createSyncPublishedResumeMethod,
    enableClientSync,
    publishedResume,
  })

  if (!currentPublishedResume && syncState === 'syncing') {
    return <PublishedResumeLoadingState />
  }

  if (!currentPublishedResume) {
    return <PublishedResumeEmptyState />
  }

  const profile = currentPublishedResume.resume.profile
  const signalCards = [
    {
      label: t('signalCards.experience.label'),
      value: String(currentPublishedResume.resume.experiences.length).padStart(2, '0'),
      description: t('signalCards.experience.description'),
    },
    {
      label: t('signalCards.projects.label'),
      value: String(currentPublishedResume.resume.projects.length).padStart(2, '0'),
      description: t('signalCards.projects.description'),
    },
    {
      label: t('signalCards.skills.label'),
      value: String(currentPublishedResume.resume.skills.length).padStart(2, '0'),
      description: t('signalCards.skills.description'),
    },
    {
      label: t('signalCards.publicationState.label'),
      value: t('signalCards.publicationState.value'),
      description: t('signalCards.publicationState.description', {
        publishedAt: formatPublishedAt(currentPublishedResume.publishedAt, locale),
      }),
    },
  ]

  return (
    <main className="web-page-shell">
      <PublicSiteHeader locale={locale} />

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6">
        {syncState === 'error' && syncMessage ? (
          <div className="rounded-[16px] border border-red-200/70 bg-red-50/80 px-4 py-3 text-sm text-red-600 dark:border-red-500/35 dark:bg-red-500/10 dark:text-red-300">
            {syncMessage}
          </div>
        ) : null}
        <Card className="border-white/70 bg-white/82 shadow-[0_30px_80px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-slate-950/84">
          <CardHeader className="gap-3">
            <p className="web-eyebrow">{t('profileEyebrow')}</p>
            <CardTitle className="text-3xl text-slate-950 dark:text-white">{t('profileTitle')}</CardTitle>
            <CardDescription className="max-w-3xl text-base leading-7 text-slate-500 dark:text-slate-400">
              {t('profileDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {signalCards.map((card) => (
              <div
                className="rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-5 dark:border-white/10 dark:bg-white/5"
                key={card.label}>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                  {card.label}
                </p>
                <p className="mt-4 text-4xl font-bold tracking-[-0.06em] text-slate-950 dark:text-white">
                  {card.value}
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  {card.description}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card className="border-white/70 bg-white/82 dark:border-white/10 dark:bg-slate-950/84">
            <CardHeader className="gap-3">
              <p className="web-eyebrow">{t('profileStoryEyebrow')}</p>
              <CardTitle className="text-2xl text-slate-950 dark:text-white">
                {readLocalizedText(profile.fullName, locale)}
              </CardTitle>
              <CardDescription className="text-base leading-7 text-slate-500 dark:text-slate-400">
                {readLocalizedText(profile.summary, locale)}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex flex-wrap gap-3">
                <Chip>{readLocalizedText(profile.location, locale)}</Chip>
                <Chip>{profile.email}</Chip>
                <Chip>{profile.phone}</Chip>
                <Chip>{profile.website}</Chip>
              </div>

              {profile.links.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {profile.links.map((link) => (
                    <a
                      className="inline-flex min-h-11 items-center rounded-full border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-600 dark:border-white/10 dark:text-slate-300 dark:hover:border-blue-300 dark:hover:text-blue-200"
                      href={link.url}
                      key={link.url}
                      rel="noreferrer"
                      target="_blank">
                      {readLocalizedText(link.label, locale)}
                    </a>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-white/70 bg-white/82 dark:border-white/10 dark:bg-slate-950/84">
            <CardHeader className="gap-3">
              <p className="web-eyebrow">{t('aiTalkCard.eyebrow')}</p>
              <CardTitle className="text-2xl text-slate-950 dark:text-white">{t('aiTalkCard.title')}</CardTitle>
              <CardDescription className="text-base leading-7 text-slate-500 dark:text-slate-400">
                {t('aiTalkCard.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-start gap-4">
              <Link className="inline-flex" href="/ai-talk" prefetch={false}>
                <Button className="rounded-full" variant="primary">
                  {t('aiTalkCard.enter')}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}
