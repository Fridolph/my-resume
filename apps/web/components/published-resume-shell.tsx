'use client';

import { useThemeMode } from '@my-resume/ui/theme';
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

export function PublishedResumeShell({
  apiBaseUrl = DEFAULT_API_BASE_URL,
  publishedResume,
}: {
  apiBaseUrl?: string;
  publishedResume: ResumePublishedSnapshot | null;
}) {
  const [locale, setLocale] = useState<ResumeLocale>('zh');
  const { theme, setTheme } = useThemeMode();

  if (!publishedResume) {
    return <PublishedResumeEmptyState />;
  }

  const { education, experiences, highlights, projects, skills } =
    publishedResume.resume;

  return (
    <main className="page-shell" data-template="standard">
      <PublishedResumeHero
        apiBaseUrl={apiBaseUrl}
        locale={locale}
        onChangeLocale={setLocale}
        onChangeTheme={setTheme}
        publishedResume={publishedResume}
        theme={theme}
      />

      <section className="content-grid">
        <div className="section-stack">
          <PublishedResumeExperienceSection
            experiences={experiences}
            locale={locale}
          />
          <PublishedResumeProjectsSection locale={locale} projects={projects} />
        </div>

        <div className="section-stack">
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
      </section>
    </main>
  );
}
