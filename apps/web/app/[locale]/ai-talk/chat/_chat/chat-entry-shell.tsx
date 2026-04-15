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
          <Card className={interactiveCardSurfaceClass}>
            <CardHeader className="gap-3">
              <p className="web-eyebrow">{t('chat.eyebrow')}</p>
              <CardTitle className="text-3xl text-slate-950 dark:text-white">
                {t('chat.title')}
              </CardTitle>
              <CardDescription className="max-w-3xl text-base leading-7 text-slate-500 dark:text-slate-400">
                {t('chat.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="flex max-w-full flex-nowrap items-center gap-3 overflow-x-auto"
                data-testid="ai-talk-chat-chip-row">
                <Chip color="accent" size="sm" variant="primary">
                  {t('status.trialCode')}
                </Chip>
                <Chip size="sm" variant="soft">
                  {t('chat.badgeQuota')}
                </Chip>
                <Chip size="sm" variant="soft">
                  {t('chat.badgeStreaming')}
                </Chip>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-3">
            {['code', 'session', 'citations'].map((item) => (
              <Card className={interactiveCardSurfaceClass} key={item}>
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

          <Card className={interactiveCardSurfaceClass}>
            <CardHeader className="gap-3">
              <p className="web-eyebrow">{t('chat.workspacePreview.eyebrow')}</p>
              <CardTitle className="text-2xl text-slate-950 dark:text-white">
                {t('chat.workspacePreview.title')}
              </CardTitle>
              <CardDescription className="text-base leading-7 text-slate-500 dark:text-slate-400">
                {t('chat.workspacePreview.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="flex w-full flex-wrap items-center justify-end gap-3"
                data-testid="ai-talk-chat-cta-row">
                <RouteCtaButton href="/ai-talk/sessions/demo-session" tone="primary">
                  {t('chat.workspacePreview.primaryCta')}
                </RouteCtaButton>
                <RouteCtaButton href="/ai-talk">
                  {t('chat.workspacePreview.secondaryCta')}
                </RouteCtaButton>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </AiTalkPageFrame>
  )
}
