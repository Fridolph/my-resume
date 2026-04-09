'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Chip,
} from '@heroui/react'
import { useState } from 'react'

import type {
  ResumeLocale,
  ResumePublishedSnapshot,
} from '../../lib/published-resume-types'
import { PublishedResumeEmptyState } from '../published-resume/published-resume-empty-state'
import {
  readLocalizedText,
  resumeLabels,
} from '../published-resume/published-resume-utils'
import { PublicSiteHeader } from '../site/header'

interface AiTalkPlaceholderShellProps {
  apiBaseUrl: string
  publishedResume: ResumePublishedSnapshot | null
}

export function AiTalkPlaceholderShell({
  apiBaseUrl: _apiBaseUrl,
  publishedResume,
}: AiTalkPlaceholderShellProps) {
  const [locale, setLocale] = useState<ResumeLocale>('zh')

  if (!publishedResume) {
    return <PublishedResumeEmptyState />
  }

  const labels = resumeLabels[locale]
  const profile = publishedResume.resume.profile
  const prompts =
    locale === 'zh'
      ? [
          '他最近几年主要做过哪些项目？',
          '他更偏前端还是全栈？',
          '如果你是招聘方，最值得追问的亮点是什么？',
        ]
      : [
          'What projects has he focused on in recent years?',
          'Is he more frontend-oriented or full-stack?',
          'What should an interviewer ask about next?',
        ]

  return (
    <main className="web-page-shell">
      <PublicSiteHeader locale={locale} onChangeLocale={setLocale} />

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6">
        <Card className="border-white/70 bg-white/82 shadow-[0_30px_80px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-slate-950/84">
          <CardHeader className="gap-3">
            <p className="web-eyebrow">{labels.aiTalkEyebrow}</p>
            <CardTitle className="text-3xl text-slate-950 dark:text-white">
              {labels.aiTalkTitle}
            </CardTitle>
            <CardDescription className="max-w-3xl text-base leading-7 text-slate-500 dark:text-slate-400">
              {labels.aiTalkDescription}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Chip color="accent" variant="primary">
              {labels.aiTalkStatus}
            </Chip>
            <Chip variant="soft">{readLocalizedText(profile.fullName, locale)}</Chip>
            <Chip variant="soft">{readLocalizedText(profile.headline, locale)}</Chip>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-white/70 bg-white/82 dark:border-white/10 dark:bg-slate-950/84">
            <CardHeader className="gap-3">
              <p className="web-eyebrow">{labels.aiTalkReadyEyebrow}</p>
              <CardTitle className="text-2xl text-slate-950 dark:text-white">
                {labels.aiTalkReadyTitle}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm leading-7 text-slate-500 dark:text-slate-400">
              <p>{labels.aiTalkReadyLineOne}</p>
              <p>{labels.aiTalkReadyLineTwo}</p>
              <p>{labels.aiTalkReadyLineThree}</p>
            </CardContent>
          </Card>

          <Card className="border-white/70 bg-white/82 dark:border-white/10 dark:bg-slate-950/84">
            <CardHeader className="gap-3">
              <p className="web-eyebrow">{labels.aiTalkPromptsEyebrow}</p>
              <CardTitle className="text-2xl text-slate-950 dark:text-white">
                {labels.aiTalkPromptsTitle}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {prompts.map((prompt) => (
                <div
                  className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 px-4 py-4 text-sm font-medium text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                  key={prompt}>
                  {prompt}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}
