'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@heroui/react/card'
import { useTranslations } from 'next-intl'

import type {
  ResumeLocale,
  ResumePublishedSnapshot,
} from '@shared/published-resume/types/published-resume.types'
import { interactiveCardSurfaceClass } from '@shared/site/card-surface'
import { RouteCtaButton } from '@shared/site/route-cta-button'
import { AiTalkPageFrame } from '../../../_ai-talk/page-frame'

interface AiTalkSessionShellProps {
  apiBaseUrl?: string
  enableClientSync?: boolean
  locale?: ResumeLocale
  publishedResume: ResumePublishedSnapshot | null
  sessionId: string
}

export function AiTalkSessionShell({
  apiBaseUrl,
  enableClientSync = false,
  locale = 'zh',
  publishedResume,
  sessionId,
}: AiTalkSessionShellProps) {
  const t = useTranslations('aiTalk')
  const primaryTagClass =
    'inline-flex min-h-9 items-center rounded-full bg-[var(--display-color-accent)] px-4 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(37,99,235,0.18)]'
  const softTagClass =
    'inline-flex min-h-9 items-center rounded-full border border-slate-200 bg-slate-100/80 px-4 text-sm font-semibold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200'

  return (
    <AiTalkPageFrame
      apiBaseUrl={apiBaseUrl}
      enableClientSync={enableClientSync}
      locale={locale}
      publishedResume={publishedResume}>
      {() => (
        <>
          <Card className={interactiveCardSurfaceClass}>
            <CardHeader className="gap-3">
              <p className="web-eyebrow">{t('session.eyebrow')}</p>
              <CardTitle className="text-3xl text-slate-950 dark:text-white">
                {t('session.title', { sessionId })}
              </CardTitle>
              <CardDescription className="max-w-3xl text-base leading-7 text-slate-500 dark:text-slate-400">
                {t('session.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex max-w-full flex-nowrap items-center gap-3 overflow-x-auto">
                <span className={`${primaryTagClass} shrink-0 whitespace-nowrap`}>
                  {t('status.streaming')}
                </span>
                <span className={`${softTagClass} shrink-0 whitespace-nowrap`}>
                  {t('session.badgeTimeline')}
                </span>
                <span className={`${softTagClass} shrink-0 whitespace-nowrap`}>
                  {t('session.badgeSources')}
                </span>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-3">
            {['messages', 'sources', 'quota'].map((item) => (
              <Card className={interactiveCardSurfaceClass} key={item}>
                <CardHeader className="gap-3">
                  <p className="web-eyebrow">{t(`session.blocks.${item}.eyebrow`)}</p>
                  <CardTitle className="text-2xl text-slate-950 dark:text-white">
                    {t(`session.blocks.${item}.title`)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-7 text-slate-500 dark:text-slate-400">
                  {t(`session.blocks.${item}.description`)}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <RouteCtaButton href="/ai-talk/chat" tone="primary">
              {t('session.backToChat')}
            </RouteCtaButton>
            <RouteCtaButton href="/ai-talk">
              {t('session.backToHub')}
            </RouteCtaButton>
          </div>
        </>
      )}
    </AiTalkPageFrame>
  )
}
