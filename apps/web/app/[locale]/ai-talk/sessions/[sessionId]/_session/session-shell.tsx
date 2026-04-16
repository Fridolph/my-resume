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
              <div
                className="flex max-w-full flex-nowrap items-center gap-3 overflow-x-auto"
                data-testid="ai-talk-session-chip-row">
                <Chip
                  className="shrink-0 whitespace-nowrap font-semibold"
                  color="accent"
                  size="sm"
                  variant="primary">
                  {t('status.streaming')}
                </Chip>
                <Chip className="shrink-0 whitespace-nowrap font-semibold" size="sm" variant="soft">
                  {t('session.badgeTimeline')}
                </Chip>
                <Chip className="shrink-0 whitespace-nowrap font-semibold" size="sm" variant="soft">
                  {t('session.badgeSources')}
                </Chip>
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
