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

  return (
    <main className="web-page-shell" data-template="standard">
      <PublicSiteHeader
        apiBaseUrl={apiBaseUrl}
        locale={locale}
        onChangeLocale={setLocale}
      />

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <PublishedResumeHero
              locale={locale}
              publishedResume={publishedResume}
            />
          </aside>

          <div className="grid gap-6">
            <PublishedResumeEducationSection education={education} locale={locale} />
            <PublishedResumeExperienceSection
              experiences={experiences}
              locale={locale}
            />
            <PublishedResumeProjectsSection locale={locale} projects={projects} />
            <PublishedResumeSkillsSection locale={locale} skills={skills} />
            <PublishedResumeHighlightsSection
              highlights={highlights}
              locale={locale}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
