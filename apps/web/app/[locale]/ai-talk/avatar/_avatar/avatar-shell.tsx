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
import { readLocalizedText } from '@shared/published-resume/published-resume-utils'
import { AiTalkPageFrame } from '../../_ai-talk/page-frame'

interface AiTalkAvatarShellProps {
  apiBaseUrl?: string
  enableClientSync?: boolean
  locale?: ResumeLocale
  publishedResume: ResumePublishedSnapshot | null
}

const ghostCtaLinkClass =
  'inline-flex min-h-10 items-center justify-center rounded-full border border-slate-200 bg-white/75 px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-white'

export function AiTalkAvatarShell({
  apiBaseUrl,
  enableClientSync = false,
  locale = 'zh',
  publishedResume,
}: AiTalkAvatarShellProps) {
  const t = useTranslations('aiTalk')

  return (
    <AiTalkPageFrame
      apiBaseUrl={apiBaseUrl}
      enableClientSync={enableClientSync}
      locale={locale}
      publishedResume={publishedResume}>
      {({ publishedResume: snapshot }) => {
        const profile = snapshot.resume.profile

        return (
          <>
            <Card className="border-white/70 bg-white/82 shadow-[0_30px_80px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-slate-950/84">
              <CardHeader className="gap-3">
                <p className="web-eyebrow">{t('avatar.eyebrow')}</p>
                <CardTitle className="text-3xl text-slate-950 dark:text-white">
                  {t('avatar.title')}
                </CardTitle>
                <CardDescription className="max-w-3xl text-base leading-7 text-slate-500 dark:text-slate-400">
                  {t('avatar.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Chip color="accent" variant="primary">
                  {t('status.comingSoon')}
                </Chip>
                <Chip variant="soft">{readLocalizedText(profile.fullName, locale)}</Chip>
                <Chip variant="soft">{readLocalizedText(profile.headline, locale)}</Chip>
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <Card className="border-white/70 bg-white/82 dark:border-white/10 dark:bg-slate-950/84">
                <CardHeader className="gap-3">
                  <p className="web-eyebrow">{t('avatar.intro.eyebrow')}</p>
                  <CardTitle className="text-2xl text-slate-950 dark:text-white">
                    {readLocalizedText(profile.fullName, locale)}
                  </CardTitle>
                  <CardDescription className="text-base leading-7 text-slate-500 dark:text-slate-400">
                    {readLocalizedText(profile.summary, locale)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 text-sm leading-7 text-slate-500 dark:text-slate-400">
                  <p>{t('avatar.intro.lineOne')}</p>
                  <p>{t('avatar.intro.lineTwo')}</p>
                  <p>{t('avatar.intro.lineThree')}</p>
                </CardContent>
              </Card>

              <Card className="border-white/70 bg-white/82 dark:border-white/10 dark:bg-slate-950/84">
                <CardHeader className="gap-3">
                  <p className="web-eyebrow">{t('avatar.contract.eyebrow')}</p>
                  <CardTitle className="text-2xl text-slate-950 dark:text-white">
                    {t('avatar.contract.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3">
                  {['role', 'media', 'controls'].map((item) => (
                    <div
                      className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 px-4 py-4 text-sm leading-6 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                      key={item}>
                      <p className="font-semibold">{t(`avatar.contract.items.${item}.title`)}</p>
                      <p className="mt-2">{t(`avatar.contract.items.${item}.description`)}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link className={ghostCtaLinkClass} href="/ai-talk">
                {t('avatar.backToHub')}
              </Link>
            </div>
          </>
        )
      }}
    </AiTalkPageFrame>
  )
}
