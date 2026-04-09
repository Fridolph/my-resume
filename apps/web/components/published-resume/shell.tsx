'use client'

import { useState } from 'react'

import { DEFAULT_API_BASE_URL } from '../../lib/env'
import { ResumeLocale, ResumePublishedSnapshot } from '../../lib/published-resume-types'
import { PublishedResumeEducationSection } from './published-resume-education-section'
import { PublishedResumeEmptyState } from './published-resume-empty-state'
import { PublishedResumeExperienceSection } from './published-resume-experience-section'
import { PublishedResumeHero } from './published-resume-hero'
import { PublishedResumeProjectsSection } from './published-resume-projects-section'
import { PublishedResumeSkillsSection } from './published-resume-skills-section'
import { PublicSiteHeader } from '../site/header'

export function PublishedResumeShell({
  apiBaseUrl = DEFAULT_API_BASE_URL,
  publishedResume,
}: {
  apiBaseUrl?: string
  publishedResume: ResumePublishedSnapshot | null
}) {
  const [locale, setLocale] = useState<ResumeLocale>('zh')

  if (!publishedResume) {
    return <PublishedResumeEmptyState />
  }

  const { education, experiences, projects, skills } = publishedResume.resume
  const sidebarStickyClass = 'lg:sticky lg:top-[5.5rem] lg:self-start'

  return (
    <main className="web-page-shell" data-template="standard">
      <PublicSiteHeader
        apiBaseUrl={apiBaseUrl}
        locale={locale}
        onChangeLocale={setLocale}
      />

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className={sidebarStickyClass}>
            <PublishedResumeHero locale={locale} publishedResume={publishedResume} />
          </aside>

          <div className="grid gap-6">
            <PublishedResumeEducationSection education={education} locale={locale} />
            <PublishedResumeExperienceSection experiences={experiences} locale={locale} />
            <PublishedResumeProjectsSection locale={locale} projects={projects} />
            <PublishedResumeSkillsSection locale={locale} skills={skills} />
          </div>
        </div>
      </section>
    </main>
  )
}
