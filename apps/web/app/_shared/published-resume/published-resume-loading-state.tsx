'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@heroui/react/card'
import { Skeleton } from '@heroui/react/skeleton'
import { useTranslations } from 'next-intl'

export function PublishedResumeLoadingState() {
  const t = useTranslations('publishedResume')

  return (
    <main className="web-page-shell">
      <section className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-6 sm:px-6">
        <Card className="border-white/70 bg-white/84 shadow-[0_24px_70px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-slate-950/84">
          <CardHeader className="gap-3">
            <p className="web-eyebrow">{t('pageEyebrow')}</p>
            <CardTitle className="text-3xl text-slate-950 dark:text-white">
              {t('loadingTitle')}
            </CardTitle>
            <CardDescription className="text-base leading-7 text-slate-500 dark:text-slate-400">
              {t('loadingDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3" data-testid="published-resume-loading-skeleton">
            <Skeleton className="h-5 w-2/3 rounded-md bg-slate-200/80 dark:bg-slate-700/70" />
            <Skeleton className="h-5 rounded-md bg-slate-200/80 dark:bg-slate-700/70" />
            <Skeleton className="h-5 w-4/5 rounded-md bg-slate-200/80 dark:bg-slate-700/70" />
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
