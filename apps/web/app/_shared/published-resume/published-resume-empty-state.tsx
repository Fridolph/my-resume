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

export function PublishedResumeEmptyState() {
  const t = useTranslations('publishedResume')

  return (
    <main className="web-page-shell">
      <section className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-6 sm:px-6">
        <Card className={displayCardSurfaceClass}>
          <CardHeader className="gap-3">
            <p className="web-eyebrow">{t('pageEyebrow')}</p>
            <CardTitle className="text-3xl text-slate-950 dark:text-white">
              {t('emptyTitle')}
            </CardTitle>
            <CardDescription className="text-base leading-7 text-slate-500 dark:text-slate-400">
              {t('emptyDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent />
        </Card>
      </section>
    </main>
  )
}
