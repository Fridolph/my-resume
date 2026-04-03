'use client';

import { useState } from 'react';

import { DEFAULT_API_BASE_URL } from '../lib/env';
import { ResumeLocale, ResumePublishedSnapshot } from '../lib/published-resume-types';
import { PublishedResumeEducationSection } from './published-resume/published-resume-education-section';
import { PublishedResumeEmptyState } from './published-resume/published-resume-empty-state';
import { PublishedResumeExperienceSection } from './published-resume/published-resume-experience-section';
import { PublishedResumeHero } from './published-resume/published-resume-hero';
import { PublishedResumeHighlightsSection } from './published-resume/published-resume-highlights-section';
import { PublishedResumeProjectsSection } from './published-resume/published-resume-projects-section';
import { PublishedResumeSkillsSection } from './published-resume/published-resume-skills-section';
import { resumeLabels } from './published-resume/published-resume-utils';
import { PublicSiteHeader } from './public-site-header';

export function PublishedResumeShell({
  apiBaseUrl = DEFAULT_API_BASE_URL,
  publishedResume,
}: {
  apiBaseUrl?: string;
  publishedResume: ResumePublishedSnapshot | null;
}) {
  const [locale, setLocale] = useState<ResumeLocale>('zh');

  if (!publishedResume) {
    return <PublishedResumeEmptyState />;
  }

  const { education, experiences, highlights, projects, skills } =
    publishedResume.resume;
  const labels = resumeLabels[locale];

  return (
    <main className="web-page-shell" data-template="standard">
      <PublicSiteHeader locale={locale} onChangeLocale={setLocale} />

      <section className="mx-auto grid w-full max-w-7xl gap-6">
        <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="grid gap-6">
            <PublishedResumeHero
              apiBaseUrl={apiBaseUrl}
              locale={locale}
              onChangeLocale={setLocale}
              publishedResume={publishedResume}
            />
            <div className="grid gap-6">
              <PublishedResumeEducationSection
                education={education}
                locale={locale}
              />
              <PublishedResumeSkillsSection locale={locale} skills={skills} />
              <PublishedResumeHighlightsSection
                highlights={highlights}
                locale={locale}
              />
            </div>
          </div>

          <div className="grid gap-6">
            <div className="grid gap-2 rounded-[1.75rem] border border-dashed border-slate-300 bg-white/60 px-5 py-5 dark:border-white/10 dark:bg-white/5">
              <p className="web-eyebrow">{labels.pageEyebrow}</p>
              <h2 className="text-2xl font-semibold tracking-[-0.05em] text-slate-950 dark:text-white">
                {labels.pageTitle}
              </h2>
              <p className="text-base leading-7 text-slate-500 dark:text-slate-400">
                {labels.pageDescription}
              </p>
            </div>

            <div className="grid gap-6">
              <PublishedResumeExperienceSection
                experiences={experiences}
                locale={locale}
              />
              <PublishedResumeProjectsSection locale={locale} projects={projects} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
