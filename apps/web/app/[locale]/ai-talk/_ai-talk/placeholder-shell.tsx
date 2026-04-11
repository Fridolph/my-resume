'use client'

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
import type {
  ResumeLocale,
  ResumePublishedSnapshot,
} from '@shared/published-resume/types/published-resume.types'
import { PublishedResumeEmptyState } from '@shared/published-resume/published-resume-empty-state'
import { PublishedResumeLoadingState } from '@shared/published-resume/published-resume-loading-state'
import {
  readLocalizedText,
} from '@shared/published-resume/published-resume-utils'
import { createFetchPublishedResumeMethod } from '@shared/published-resume/services/published-resume-api'
import { usePublishedResumeSync } from '@shared/published-resume/hooks/use-published-resume-sync'
import { PublicSiteHeader } from '@shared/site/site-header'

interface AiTalkPlaceholderShellProps {
  apiBaseUrl?: string
  createSyncPublishedResumeMethod?: typeof createFetchPublishedResumeMethod
  enableClientSync?: boolean
  locale?: ResumeLocale
  publishedResume: ResumePublishedSnapshot | null
}

export function AiTalkPlaceholderShell({
  apiBaseUrl = DEFAULT_API_BASE_URL,
  createSyncPublishedResumeMethod = createFetchPublishedResumeMethod,
  enableClientSync = false,
  locale = 'zh',
  publishedResume,
}: AiTalkPlaceholderShellProps) {
  const t = useTranslations('aiTalk')
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
  const prompts = [t('prompts.one'), t('prompts.two'), t('prompts.three')]

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
            <p className="web-eyebrow">{t('eyebrow')}</p>
            <CardTitle className="text-3xl text-slate-950 dark:text-white">{t('title')}</CardTitle>
            <CardDescription className="max-w-3xl text-base leading-7 text-slate-500 dark:text-slate-400">
              {t('description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Chip color="accent" variant="primary">
              {t('status')}
            </Chip>
            <Chip variant="soft">{readLocalizedText(profile.fullName, locale)}</Chip>
            <Chip variant="soft">{readLocalizedText(profile.headline, locale)}</Chip>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-white/70 bg-white/82 dark:border-white/10 dark:bg-slate-950/84">
            <CardHeader className="gap-3">
              <p className="web-eyebrow">{t('ready.eyebrow')}</p>
              <CardTitle className="text-2xl text-slate-950 dark:text-white">{t('ready.title')}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm leading-7 text-slate-500 dark:text-slate-400">
              <p>{t('ready.lineOne')}</p>
              <p>{t('ready.lineTwo')}</p>
              <p>{t('ready.lineThree')}</p>
            </CardContent>
          </Card>

          <Card className="border-white/70 bg-white/82 dark:border-white/10 dark:bg-slate-950/84">
            <CardHeader className="gap-3">
              <p className="web-eyebrow">{t('prompts.eyebrow')}</p>
              <CardTitle className="text-2xl text-slate-950 dark:text-white">{t('prompts.title')}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {prompts.map((prompt) => (
                <div
                  className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 px-4 py-4 text-sm font-medium text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                  key={prompt}>
                  {prompt}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}
