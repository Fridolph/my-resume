'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@heroui/react/card'
import { useTranslations } from 'next-intl'

import { displayCardSurfaceClass } from '@shared/site/card-surface'

export function PublishedResumeUnavailableState({
  message,
}: {
  message?: string | null
}) {
  const t = useTranslations('publishedResume')

  return (
    <Card className={displayCardSurfaceClass}>
      <CardHeader className="gap-3">
        <p className="web-eyebrow">{t('pageEyebrow')}</p>
        <CardTitle className="text-3xl text-slate-950 dark:text-white">
          {t('unavailableTitle')}
        </CardTitle>
        <CardDescription className="text-base leading-7 text-slate-500 dark:text-slate-400">
          {t('unavailableDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
          {t('unavailableHint')}
        </p>
        {message ? (
          <div
            className="rounded-[16px] border border-amber-200/70 bg-amber-50/80 px-4 py-3 text-sm leading-6 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100"
            data-testid="published-resume-unavailable-message">
            {message}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
