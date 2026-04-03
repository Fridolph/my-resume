import { Card, CardContent, CardDescription, CardHeader, CardTitle, Chip } from '@heroui/react';

import { ResumeLocale, ResumePublishedSnapshot } from '../../lib/published-resume-types';
import {
  formatPublishedAt,
  readLocalizedText,
  resumeLabels,
} from './published-resume-utils';

interface PublishedResumeHeroProps {
  locale: ResumeLocale;
  publishedResume: ResumePublishedSnapshot;
}

export function PublishedResumeHero({
  locale,
  publishedResume,
}: PublishedResumeHeroProps) {
  const labels = resumeLabels[locale];
  const profile = publishedResume.resume.profile;
  const localizedInterests = profile.interests.map((item) =>
    readLocalizedText(item, locale),
  );
  const contactItems = [
    readLocalizedText(profile.location, locale),
    profile.email,
    profile.phone,
    profile.website,
  ].filter(Boolean);

  return (
    <Card className="web-section-card overflow-hidden">
      <CardHeader className="grid gap-4">
        <div className="grid gap-2">
          <p className="web-eyebrow">{labels.profileCardLabel}</p>
          <CardTitle className="text-[clamp(2.2rem,5vw,3.4rem)] leading-none tracking-[-0.08em] text-slate-950 dark:text-white">
            {readLocalizedText(profile.fullName, locale)}
          </CardTitle>
          <CardDescription className="text-lg font-semibold tracking-[-0.04em] text-slate-500 dark:text-slate-300">
            {readLocalizedText(profile.headline, locale)}
          </CardDescription>
        </div>
        <p className="text-base leading-7 text-slate-500 dark:text-slate-400">
          {readLocalizedText(profile.summary, locale)}
        </p>
      </CardHeader>

      <CardContent className="grid gap-5 pt-0">
        <div className="grid gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
          <div className="grid gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              {labels.contactTitle}
            </p>
            <div className="grid gap-2">
              {contactItems.map((item) => (
                <p
                  className="break-all text-sm font-medium leading-6 text-slate-600 dark:text-slate-300"
                  key={item}
                >
                  {item}
                </p>
              ))}
            </div>
          </div>
        </div>

        {profile.links.length > 0 ? (
          <div className="grid gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              {labels.profileLinksTitle}
            </p>
            <div className="flex flex-wrap gap-3">
              {profile.links.map((link) => (
                <a
                  className="inline-flex min-h-10 items-center rounded-full border border-slate-200 bg-white/70 px-4 text-sm font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-blue-300 dark:hover:text-blue-200"
                  href={link.url}
                  key={link.url}
                  rel="noreferrer"
                  target="_blank"
                >
                  {readLocalizedText(link.label, locale)}
                </a>
              ))}
            </div>
          </div>
        ) : null}

        {localizedInterests.length > 0 ? (
          <>
            <div className="h-px w-full bg-slate-200 dark:bg-white/10" />
            <div className="grid gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                {labels.interestsTitle}
              </p>
              <div className="flex flex-wrap gap-3">
                {localizedInterests.map((interest) => (
                  <Chip key={interest} variant="soft">
                    {interest}
                  </Chip>
                ))}
              </div>
            </div>
          </>
        ) : null}

        <div className="rounded-[1.5rem] border border-blue-200 bg-blue-50/70 p-4 dark:border-blue-400/20 dark:bg-blue-500/10">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-500 dark:text-blue-200">
            {labels.publishedAt}
          </p>
          <p className="mt-2 text-sm font-medium leading-6 text-slate-700 dark:text-slate-200">
            {formatPublishedAt(publishedResume.publishedAt, locale)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
