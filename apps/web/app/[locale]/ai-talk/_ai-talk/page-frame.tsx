'use client'

import { ReactNode } from 'react'

import { DEFAULT_API_BASE_URL } from '@core/env'
import type {
  ResumeLocale,
  ResumePublishedSnapshot,
} from '@shared/published-resume/types/published-resume.types'
import { PublishedResumeEmptyState } from '@shared/published-resume/published-resume-empty-state'
import { PublishedResumeLoadingState } from '@shared/published-resume/published-resume-loading-state'
import { createFetchPublishedResumeMethod } from '@shared/published-resume/services/published-resume-api'
import { usePublishedResumeSync } from '@shared/published-resume/hooks/use-published-resume-sync'
import { PublicSiteHeader } from '@shared/site/site-header'

interface AiTalkPageFrameProps {
  apiBaseUrl?: string
  children: (input: { publishedResume: ResumePublishedSnapshot }) => ReactNode
  createSyncPublishedResumeMethod?: typeof createFetchPublishedResumeMethod
  enableClientSync?: boolean
  locale?: ResumeLocale
  publishedResume: ResumePublishedSnapshot | null
}

export function AiTalkPageFrame({
  apiBaseUrl = DEFAULT_API_BASE_URL,
  children,
  createSyncPublishedResumeMethod = createFetchPublishedResumeMethod,
  enableClientSync = false,
  locale = 'zh',
  publishedResume,
}: AiTalkPageFrameProps) {
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

  return (
    <main className="web-page-shell">
      <PublicSiteHeader locale={locale} />

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6">
        {syncState === 'error' && syncMessage ? (
          <div className="rounded-[16px] border border-red-200/70 bg-red-50/80 px-4 py-3 text-sm text-red-600 dark:border-red-500/35 dark:bg-red-500/10 dark:text-red-300">
            {syncMessage}
          </div>
        ) : null}
        {children({ publishedResume: currentPublishedResume })}
      </section>
    </main>
  )
}
