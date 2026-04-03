import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Chip } from '@heroui/react';
import { buildPublishedResumeExportUrl } from '@my-resume/api-client';
import Link from 'next/link';

import { ResumeLocale, ResumePublishedSnapshot } from '../../lib/published-resume-types';
import {
  formatPublishedAt,
  readLocalizedText,
  resumeLabels,
} from './published-resume-utils';

interface PublishedResumeHeroProps {
  apiBaseUrl: string;
  locale: ResumeLocale;
  publishedResume: ResumePublishedSnapshot;
  onChangeLocale: (locale: ResumeLocale) => void;
}

export function PublishedResumeHero({
  apiBaseUrl,
  locale,
  publishedResume,
  onChangeLocale,
}: PublishedResumeHeroProps) {
  const labels = resumeLabels[locale];
  const profile = publishedResume.resume.profile;
  const markdownExportUrl = buildPublishedResumeExportUrl({
    apiBaseUrl,
    format: 'markdown',
    locale,
  });
  const pdfExportUrl = buildPublishedResumeExportUrl({
    apiBaseUrl,
    format: 'pdf',
    locale,
  });
  const localizedInterests = profile.interests.map((item) =>
    readLocalizedText(item, locale),
  );

  return (
    <Card className="hero-card border-white/70 bg-white/84 shadow-[0_32px_90px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-slate-950/84">
      <CardHeader className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr] lg:items-start">
        <div className="grid gap-5">
          <div className="grid gap-3">
            <p className="web-eyebrow">{labels.pageEyebrow}</p>
            <CardTitle className="text-[clamp(3rem,8vw,6rem)] leading-[0.9] tracking-[-0.08em] text-slate-950 dark:text-white">
              {readLocalizedText(profile.fullName, locale)}
            </CardTitle>
            <p className="text-2xl font-semibold tracking-[-0.05em] text-slate-500 dark:text-slate-300">
              {readLocalizedText(profile.headline, locale)}
            </p>
            <CardDescription className="max-w-3xl text-lg leading-8 text-slate-500 dark:text-slate-400">
              {readLocalizedText(profile.summary, locale)}
            </CardDescription>
          </div>

          <div className="flex flex-wrap gap-3">
            <Chip>{readLocalizedText(profile.location, locale)}</Chip>
            <Chip>{profile.email}</Chip>
            <Chip>{profile.phone}</Chip>
            <Chip>{profile.website}</Chip>
            <Chip>
              {labels.publishedAt} {formatPublishedAt(publishedResume.publishedAt, locale)}
            </Chip>
          </div>
        </div>

        <div className="grid gap-4">
          <Card className="rounded-[1.75rem] border border-blue-200 bg-blue-50/70 shadow-none dark:border-blue-400/20 dark:bg-blue-500/10">
            <CardHeader className="gap-3">
              <p className="web-eyebrow">{labels.standardEditionEyebrow}</p>
              <CardTitle className="text-3xl tracking-[-0.05em] text-slate-950 dark:text-white">
                {labels.standardEditionTitle}
              </CardTitle>
              <CardDescription className="text-base leading-7 text-slate-500 dark:text-slate-300">
                {labels.standardEditionDescription}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <Link href="/profile">
                <Button className="w-full rounded-full" variant="primary">
                  {labels.heroPrimaryAction}
                </Button>
              </Link>
              <Link href="/ai-talk">
                <Button className="w-full rounded-full" variant="outline">
                  {labels.heroSecondaryAction}
                </Button>
              </Link>
              <a href={markdownExportUrl}>
                <Button className="w-full rounded-full" variant="ghost">
                  {labels.exportMarkdown}
                </Button>
              </a>
              <a href={pdfExportUrl}>
                <Button className="w-full rounded-full" variant="ghost">
                  {labels.exportPdf}
                </Button>
              </a>
            </CardContent>
          </Card>

          {profile.links.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {profile.links.map((link) => (
                <a
                  className="inline-flex min-h-11 items-center rounded-full border border-slate-200 bg-white/70 px-4 text-sm font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-blue-300 dark:hover:text-blue-200"
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
        </div>
      </CardHeader>

      {localizedInterests.length > 0 ? (
        <CardContent className="grid gap-4 pt-0">
          <div className="grid gap-2">
            <p className="web-eyebrow">{labels.interestsEyebrow}</p>
            <h2 className="text-xl font-semibold text-slate-950 dark:text-white">
              {labels.interestsTitle}
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {localizedInterests.map((interest) => (
              <Chip key={interest} variant="soft">
                {interest}
              </Chip>
            ))}
          </div>
        </CardContent>
      ) : null}
    </Card>
  );
}
