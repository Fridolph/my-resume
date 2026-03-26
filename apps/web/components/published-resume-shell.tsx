'use client';

import { DisplayStatCard } from '@my-resume/ui/display';
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
import {
  formatPublishedAt,
  resumeLabels,
} from './published-resume/published-resume-utils';

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

  const labels = resumeLabels[locale];
  const { education, experiences, highlights, projects, skills } =
    publishedResume.resume;
  const signalCards = [
    {
      label: labels.experienceCountLabel,
      value: String(experiences.length).padStart(2, '0'),
      description: labels.experienceCountDescription,
    },
    {
      label: labels.projectsCountLabel,
      value: String(projects.length).padStart(2, '0'),
      description: labels.projectsCountDescription,
    },
    {
      label: labels.skillsCountLabel,
      value: String(skills.length).padStart(2, '0'),
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
    <main className="page-shell" data-template="standard">
      <PublishedResumeHero
        apiBaseUrl={apiBaseUrl}
        locale={locale}
        onChangeLocale={setLocale}
        onChangeTheme={setTheme}
        publishedResume={publishedResume}
        theme={theme}
      />

      <section className="signal-shell">
        <div className="signal-header">
          <p className="eyebrow">{labels.resumeSignalsEyebrow}</p>
          <h2 className="signal-title">{labels.resumeSignalsTitle}</h2>
        </div>
        <div className="signal-grid">
          {signalCards.map((card) => (
            <DisplayStatCard
              className="signal-card"
              description={card.description}
              key={card.label}
              label={card.label}
              value={card.value}
            />
          ))}
        </div>
      </section>

      <section className="content-grid">
        <div className="section-stack primary-stack">
          <PublishedResumeExperienceSection
            experiences={experiences}
            locale={locale}
          />
          <PublishedResumeProjectsSection locale={locale} projects={projects} />
        </div>

        <div className="section-stack secondary-stack">
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
