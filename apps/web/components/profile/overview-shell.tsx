'use client';

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Chip } from '@heroui/react';
import Link from 'next/link';
import { useState } from 'react';

import type { ResumeLocale, ResumePublishedSnapshot } from '../../lib/published-resume-types';
import { PublishedResumeEmptyState } from '../published-resume/published-resume-empty-state';
import { formatPublishedAt, readLocalizedText, resumeLabels } from '../published-resume/published-resume-utils';
import { PublicSiteHeader } from '../site/header';

interface ProfileOverviewShellProps {
  publishedResume: ResumePublishedSnapshot | null;
}

export function ProfileOverviewShell({
  publishedResume,
}: ProfileOverviewShellProps) {
  const [locale, setLocale] = useState<ResumeLocale>('zh');

  if (!publishedResume) {
    return <PublishedResumeEmptyState />;
  }

  const labels = resumeLabels[locale];
  const profile = publishedResume.resume.profile;
  const signalCards = [
    {
      label: labels.experienceCountLabel,
      value: String(publishedResume.resume.experiences.length).padStart(2, '0'),
      description: labels.experienceCountDescription,
    },
    {
      label: labels.projectsCountLabel,
      value: String(publishedResume.resume.projects.length).padStart(2, '0'),
      description: labels.projectsCountDescription,
    },
    {
      label: labels.skillsCountLabel,
      value: String(publishedResume.resume.skills.length).padStart(2, '0'),
      description: labels.skillsCountDescription,
    },
    {
      label: labels.publicationStateLabel,
      value: labels.publicationStateValue,
      description: `${labels.publicationStateDescription} ${formatPublishedAt(
        publishedResume.publishedAt,
        locale,
      )}`,
    },
  ];

  return (
    <main className="web-page-shell">
      <PublicSiteHeader locale={locale} onChangeLocale={setLocale} />

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6">
        <Card className="border-white/70 bg-white/82 shadow-[0_30px_80px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-slate-950/84">
          <CardHeader className="gap-3">
            <p className="web-eyebrow">{labels.profileEyebrow}</p>
            <CardTitle className="text-3xl text-slate-950 dark:text-white">
              {labels.profileTitle}
            </CardTitle>
            <CardDescription className="max-w-3xl text-base leading-7 text-slate-500 dark:text-slate-400">
              {labels.profileDescription}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {signalCards.map((card) => (
              <div
                className="rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-5 dark:border-white/10 dark:bg-white/5"
                key={card.label}
              >
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                  {card.label}
                </p>
                <p className="mt-4 text-4xl font-bold tracking-[-0.06em] text-slate-950 dark:text-white">
                  {card.value}
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  {card.description}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card className="border-white/70 bg-white/82 dark:border-white/10 dark:bg-slate-950/84">
            <CardHeader className="gap-3">
              <p className="web-eyebrow">{labels.profileStoryEyebrow}</p>
              <CardTitle className="text-2xl text-slate-950 dark:text-white">
                {readLocalizedText(profile.fullName, locale)}
              </CardTitle>
              <CardDescription className="text-base leading-7 text-slate-500 dark:text-slate-400">
                {readLocalizedText(profile.summary, locale)}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex flex-wrap gap-3">
                <Chip>{readLocalizedText(profile.location, locale)}</Chip>
                <Chip>{profile.email}</Chip>
                <Chip>{profile.phone}</Chip>
                <Chip>{profile.website}</Chip>
              </div>

              {profile.links.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {profile.links.map((link) => (
                    <a
                      className="inline-flex min-h-11 items-center rounded-full border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-600 dark:border-white/10 dark:text-slate-300 dark:hover:border-blue-300 dark:hover:text-blue-200"
                      href={link.url}
                      key={link.url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {readLocalizedText(link.label, locale)}
                    </a>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-white/70 bg-white/82 dark:border-white/10 dark:bg-slate-950/84">
            <CardHeader className="gap-3">
              <p className="web-eyebrow">{labels.aiTalkEyebrow}</p>
              <CardTitle className="text-2xl text-slate-950 dark:text-white">
                {labels.aiTalkCardTitle}
              </CardTitle>
              <CardDescription className="text-base leading-7 text-slate-500 dark:text-slate-400">
                {labels.aiTalkCardDescription}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-start gap-4">
              <Link className="inline-flex" href="/ai-talk">
                <Button className="rounded-full" variant="primary">
                  {labels.aiTalkEnter}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
