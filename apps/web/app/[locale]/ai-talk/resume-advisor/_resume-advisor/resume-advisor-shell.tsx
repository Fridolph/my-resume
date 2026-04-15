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
import { AiTalkPageFrame } from '../../_ai-talk/page-frame'

interface AiTalkResumeAdvisorShellProps {
  apiBaseUrl?: string
  enableClientSync?: boolean
  locale?: ResumeLocale
  publishedResume: ResumePublishedSnapshot | null
}

export function AiTalkResumeAdvisorShell({
  apiBaseUrl,
  enableClientSync = false,
  locale = 'zh',
  publishedResume,
}: AiTalkResumeAdvisorShellProps) {
  const t = useTranslations('aiTalk')
  const primaryBadgeClass =
    'inline-flex min-h-10 items-center rounded-full bg-[var(--display-color-accent)] px-5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(37,99,235,0.22)] dark:text-white'
  const softBadgeClass =
    'inline-flex min-h-10 items-center rounded-full bg-slate-100 px-5 text-sm font-semibold text-slate-900 dark:bg-white/10 dark:text-slate-100'

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
              <p className="web-eyebrow">{t('resumeAdvisorPage.eyebrow')}</p>
              <CardTitle className="text-3xl text-slate-950 dark:text-white">
                {t('resumeAdvisorPage.title')}
              </CardTitle>
              <CardDescription className="max-w-3xl text-base leading-7 text-slate-500 dark:text-slate-400">
                {t('resumeAdvisorPage.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <span className={primaryBadgeClass}>{t('resumeAdvisorPage.badges.one')}</span>
              <span className={softBadgeClass}>{t('resumeAdvisorPage.badges.two')}</span>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-3">
            {['overview', 'workflow', 'boundary'].map((item) => (
              <Card className={interactiveCardSurfaceClass} key={item}>
                <CardHeader className="gap-3">
                  <p className="web-eyebrow">{t(`resumeAdvisorPage.blocks.${item}.eyebrow`)}</p>
                  <CardTitle className="text-2xl text-slate-950 dark:text-white">
                    {t(`resumeAdvisorPage.blocks.${item}.title`)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-7 text-slate-500 dark:text-slate-400">
                  {t(`resumeAdvisorPage.blocks.${item}.description`)}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <RouteCtaButton href="/ai-talk" tone="primary">
              {t('resumeAdvisorPage.primaryCta')}
            </RouteCtaButton>
            <RouteCtaButton href="/ai-talk/chat">
              {t('resumeAdvisorPage.secondaryCta')}
            </RouteCtaButton>
          </div>
        </>
      )}
    </AiTalkPageFrame>
  )
}
