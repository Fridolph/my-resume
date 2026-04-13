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
} from '../../_ai-talk/cta-link-classes'
import { AiTalkPageFrame } from '../../_ai-talk/page-frame'

interface AiTalkChatEntryShellProps {
  apiBaseUrl?: string
  enableClientSync?: boolean
  locale?: ResumeLocale
  publishedResume: ResumePublishedSnapshot | null
}

export function AiTalkChatEntryShell({
  apiBaseUrl,
  enableClientSync = false,
  locale = 'zh',
  publishedResume,
}: AiTalkChatEntryShellProps) {
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
              <p className="web-eyebrow">{t('chat.eyebrow')}</p>
              <CardTitle className="text-3xl text-slate-950 dark:text-white">
                {t('chat.title')}
              </CardTitle>
              <CardDescription className="max-w-3xl text-base leading-7 text-slate-500 dark:text-slate-400">
                {t('chat.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Chip color="accent" variant="primary">
                {t('status.trialCode')}
              </Chip>
              <Chip variant="soft">{t('chat.badgeQuota')}</Chip>
              <Chip variant="soft">{t('chat.badgeStreaming')}</Chip>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-3">
            {['code', 'session', 'citations'].map((item) => (
              <Card
                className="border-white/70 bg-white/82 dark:border-white/10 dark:bg-slate-950/84"
                key={item}>
                <CardHeader className="gap-3">
                  <p className="web-eyebrow">{t(`chat.steps.${item}.eyebrow`)}</p>
                  <CardTitle className="text-2xl text-slate-950 dark:text-white">
                    {t(`chat.steps.${item}.title`)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-7 text-slate-500 dark:text-slate-400">
                  {t(`chat.steps.${item}.description`)}
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-white/70 bg-white/82 dark:border-white/10 dark:bg-slate-950/84">
            <CardHeader className="gap-3">
              <p className="web-eyebrow">{t('chat.workspacePreview.eyebrow')}</p>
              <CardTitle className="text-2xl text-slate-950 dark:text-white">
                {t('chat.workspacePreview.title')}
              </CardTitle>
              <CardDescription className="text-base leading-7 text-slate-500 dark:text-slate-400">
                {t('chat.workspacePreview.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3">
              <Link className={aiTalkPrimaryCtaLinkClass} href="/ai-talk/sessions/demo-session">
                {t('chat.workspacePreview.primaryCta')}
              </Link>
              <Link className={aiTalkGhostCtaLinkClass} href="/ai-talk">
                {t('chat.workspacePreview.secondaryCta')}
              </Link>
            </CardContent>
          </Card>
        </>
      )}
    </AiTalkPageFrame>
  )
}
