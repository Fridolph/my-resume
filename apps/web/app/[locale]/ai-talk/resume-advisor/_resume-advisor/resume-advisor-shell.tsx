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
            <CardContent className="flex flex-wrap gap-3 flex-row">
              <Chip
                className="font-semibold"
                color="accent"
                data-testid="resume-advisor-chip-primary"
                variant="primary">
                {t('resumeAdvisorPage.badges.one')}
              </Chip>
              <Chip
                className="font-semibold"
                data-testid="resume-advisor-chip-secondary"
                variant="soft">
                {t('resumeAdvisorPage.badges.two')}
              </Chip>
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
            <RouteCtaButton
              className="border border-sky-200/80 bg-white/80 font-semibold text-slate-950 shadow-[0_12px_28px_rgba(148,163,184,0.18)] backdrop-blur transition-colors hover:bg-sky-50/85 dark:border-sky-400/20 dark:bg-slate-950/55 dark:text-slate-100 dark:hover:bg-sky-500/10"
              href="/ai-talk/chat">
              {t('resumeAdvisorPage.secondaryCta')}
            </RouteCtaButton>
          </div>
        </>
      )}
    </AiTalkPageFrame>
  )
}
