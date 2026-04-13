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

import { Link } from '@i18n/navigation'
import type {
  ResumeLocale,
  ResumePublishedSnapshot,
} from '@shared/published-resume/types/published-resume.types'
import {
  aiTalkGhostCtaLinkClass,
  aiTalkPrimaryCtaLinkClass,
} from '../../../_ai-talk/cta-link-classes'
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
          <Card className="border-white/70 bg-white/82 shadow-[0_30px_80px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-slate-950/84">
            <CardHeader className="gap-3">
              <p className="web-eyebrow">{t('session.eyebrow')}</p>
              <CardTitle className="text-3xl text-slate-950 dark:text-white">
                {t('session.title', { sessionId })}
              </CardTitle>
              <CardDescription className="max-w-3xl text-base leading-7 text-slate-500 dark:text-slate-400">
                {t('session.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Chip color="accent" variant="primary">
                {t('status.streaming')}
              </Chip>
              <Chip variant="soft">{t('session.badgeTimeline')}</Chip>
              <Chip variant="soft">{t('session.badgeSources')}</Chip>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-3">
            {['messages', 'sources', 'quota'].map((item) => (
              <Card
                className="border-white/70 bg-white/82 dark:border-white/10 dark:bg-slate-950/84"
                key={item}>
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
            <Link className={aiTalkPrimaryCtaLinkClass} href="/ai-talk/chat">
              {t('session.backToChat')}
            </Link>
            <Link className={aiTalkGhostCtaLinkClass} href="/ai-talk">
              {t('session.backToHub')}
            </Link>
          </div>
        </>
      )}
    </AiTalkPageFrame>
  )
}
