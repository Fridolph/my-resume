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

const sidebarProjectNote: Record<ResumeLocale, string> = {
  zh: '欢迎访问我的个人简历项目，了解更多构建过程与迭代记录',
  en: 'Visit the my-resume project to explore build notes and iteration details',
};

const highlightAccentClasses = [
  'from-sky-500/20 via-cyan-400/16 to-transparent dark:from-sky-400/22 dark:via-cyan-300/12',
  'from-emerald-500/20 via-teal-400/12 to-transparent dark:from-emerald-400/22 dark:via-teal-300/12',
  'from-fuchsia-500/20 via-violet-400/12 to-transparent dark:from-fuchsia-400/22 dark:via-violet-300/12',
  'from-amber-500/20 via-orange-400/12 to-transparent dark:from-amber-400/22 dark:via-orange-300/12',
  'from-rose-500/20 via-pink-400/12 to-transparent dark:from-rose-400/22 dark:via-pink-300/12',
] as const;

function LocationIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 20 20" width="16">
      <path
        d="M10 17s5-4.35 5-9a5 5 0 1 0-10 0c0 4.65 5 9 5 9Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <circle cx="10" cy="8" fill="currentColor" r="1.35" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 20 20" width="16">
      <path
        d="M3.75 5.75h12.5a1 1 0 0 1 1 1v6.5a1 1 0 0 1-1 1H3.75a1 1 0 0 1-1-1v-6.5a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="m3.5 6 6.02 4.52a.8.8 0 0 0 .96 0L16.5 6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 20 20" width="16">
      <path
        d="M6.74 3.5h2.12a.75.75 0 0 1 .72.54l.6 2.12a.75.75 0 0 1-.22.76l-1.08 1.02a10.9 10.9 0 0 0 4.18 4.18l1.02-1.08a.75.75 0 0 1 .76-.22l2.12.6a.75.75 0 0 1 .54.72v2.12a1 1 0 0 1-1 1A13.75 13.75 0 0 1 3.5 6.5a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

export function PublishedResumeHero({
  locale,
  publishedResume,
}: PublishedResumeHeroProps) {
  const labels = resumeLabels[locale];
  const profile = publishedResume.resume.profile;
  const hero = profile.hero;
  const highlights = publishedResume.resume.highlights;
  const localizedInterests = profile.interests.map((item) =>
    readLocalizedText(item, locale),
  );
  const localizedHeroSlogans = hero.slogans
    .map((item) => readLocalizedText(item, locale))
    .filter(Boolean)
    .slice(0, 2);
  const contactItems = [
    {
      key: 'location',
      icon: <LocationIcon />,
      value: readLocalizedText(profile.location, locale),
    },
    {
      key: 'email',
      icon: <MailIcon />,
      value: profile.email,
    },
    {
      key: 'phone',
      icon: <PhoneIcon />,
      value: profile.phone,
    },
  ].filter((item) => Boolean(item.value));

  const name = readLocalizedText(profile.fullName, locale);

  return (
    <Card className="web-section-card overflow-hidden">
      <CardHeader className="grid gap-5 border-b border-slate-200/80 pb-5 dark:border-white/10">
        <div className="grid gap-4">
          <div className="mx-auto flex w-full max-w-[17rem] flex-col items-center gap-4 text-center">
            <a
              className="web-avatar-flip w-full max-w-[13.5rem]"
              href={hero.linkUrl}
              rel="noreferrer"
              target="_blank"
            >
              <div className="web-avatar-flip-inner">
                <div className="web-avatar-face web-avatar-face-front">
                  <img
                    alt={`${name}头像正面`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    src={hero.frontImageUrl}
                  />
                </div>
                <div className="web-avatar-face web-avatar-face-back">
                  <img
                    alt={`${name}头像背面`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    src={hero.backImageUrl}
                  />
                </div>
              </div>
            </a>

            <div className="grid gap-2">
              {localizedHeroSlogans.map((line) => (
                <p
                  className="web-gradient-copy text-sm font-semibold leading-6 text-slate-600 dark:text-slate-200"
                  key={line}
                >
                  {line}
                </p>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <p className="web-eyebrow">{labels.profileCardLabel}</p>
            <CardTitle className="text-[clamp(2.2rem,5vw,3.4rem)] leading-none tracking-[-0.08em] text-slate-950 dark:text-white">
              {name}
            </CardTitle>
            <CardDescription className="text-base font-semibold tracking-[-0.03em] text-slate-500 dark:text-slate-300">
              {readLocalizedText(profile.headline, locale)}
            </CardDescription>
          </div>

          <p className="text-sm leading-7 text-slate-500 dark:text-slate-400">
            {readLocalizedText(profile.summary, locale)}
          </p>
        </div>
      </CardHeader>

      <CardContent className="grid gap-4 pt-5">
        <div className="grid gap-3 rounded-[1.35rem] border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            {labels.contactTitle}
          </p>
          <div className="grid gap-2">
            {contactItems.map((item) => (
              <div
                className="flex items-start gap-3 rounded-2xl bg-white/80 px-3 py-2.5 text-sm font-medium text-slate-600 dark:bg-white/[0.04] dark:text-slate-300"
                key={item.key}
              >
                <span className="mt-1 text-slate-400 dark:text-slate-500">{item.icon}</span>
                <span className="min-w-0 break-all leading-6">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {profile.links.length > 0 ? (
          <div className="grid gap-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                {labels.profileLinksTitle}
              </p>
              <Chip size="sm" variant="soft">
                {profile.links.length}
              </Chip>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
              {profile.links.map((link) => (
                <a
                  className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200/80 bg-white/80 px-3 text-center text-sm font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:border-blue-300 dark:hover:text-blue-200"
                  href={link.url}
                  key={link.url}
                  rel="noreferrer"
                  target="_blank"
                >
                  <span className="truncate">{readLocalizedText(link.label, locale)}</span>
                </a>
              ))}
            </div>
          </div>
        ) : null}

        <a
          className="group rounded-[1.35rem] border border-slate-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.88),rgba(239,246,255,0.9))] px-4 py-3.5 transition hover:border-blue-300 dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(59,130,246,0.12))]"
          href="https://github.com/Fridolph/my-resume"
          rel="noreferrer"
          target="_blank"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            GitHub
          </p>
          <p className="web-gradient-copy mt-2 text-sm font-semibold leading-6 text-slate-700 dark:text-slate-100">
            {sidebarProjectNote[locale]}
          </p>
        </a>

        {localizedInterests.length > 0 ? (
          <div className="grid gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              {labels.interestsTitle}
            </p>
            <div className="flex flex-wrap gap-2">
              {localizedInterests.map((interest) => (
                <Chip key={interest} size="sm" variant="soft">
                  {interest}
                </Chip>
              ))}
            </div>
          </div>
        ) : null}

        {highlights.length > 0 ? (
          <div className="grid gap-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                {labels.highlightsTitle}
              </p>
              <Chip size="sm" variant="soft">
                {highlights.length}
              </Chip>
            </div>
            <div className="grid gap-2.5">
              {highlights.map((item, index) => (
                <article
                  className="group relative overflow-hidden rounded-[1.2rem] border border-slate-200/80 bg-slate-50/90 px-3.5 py-3 shadow-[0_10px_28px_rgba(15,23,42,0.05)] transition duration-200 hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/[0.04]"
                  key={`${item.title.en}-${index}`}
                >
                  <div
                    className={`pointer-events-none absolute inset-0 bg-gradient-to-br opacity-0 transition duration-300 group-hover:opacity-100 ${highlightAccentClasses[index % highlightAccentClasses.length]}`}
                  />
                  <div className="relative flex items-start gap-3">
                    <span className="inline-flex size-8 flex-shrink-0 items-center justify-center rounded-full border border-slate-200/90 bg-white/90 text-[0.7rem] font-semibold tracking-[0.2em] text-slate-500 dark:border-white/10 dark:bg-white/[0.08] dark:text-slate-200">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div className="min-w-0 space-y-1">
                      <h3 className="text-sm font-semibold leading-6 text-slate-900 dark:text-white">
                        {readLocalizedText(item.title, locale)}
                      </h3>
                      <p className="text-[0.92rem] leading-6 text-slate-500 dark:text-slate-400">
                        {readLocalizedText(item.description, locale)}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : null}

        <div className="rounded-[1.2rem] border border-slate-200/80 bg-slate-50/75 px-4 py-3.5 dark:border-white/10 dark:bg-white/[0.04]">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
            {labels.publishedAt}
          </p>
          <p className="mt-1.5 text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">
            {formatPublishedAt(publishedResume.publishedAt, locale)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
