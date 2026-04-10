'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'

import { DEFAULT_API_BASE_URL } from '../../core/env'
import { ResumeLocale, ResumePublishedSnapshot } from './types/published-resume.types'
import { PublishedResumeEducationSection } from './published-resume-education-section'
import { PublishedResumeEmptyState } from './published-resume-empty-state'
import { PublishedResumeExperienceSection } from './published-resume-experience-section'
import { PublishedResumeHero } from './published-resume-hero'
import { PublishedResumeProjectsSection } from './published-resume-projects-section'
import { PublishedResumeSectionCard } from './published-resume-section-card'
import { resumeLabels } from './published-resume-utils'
import { PublicSiteHeader } from '../site/header'

const PublishedResumeSkillsSection = dynamic(
  () =>
    import('./published-resume-skills-section').then(
      (module) => module.PublishedResumeSkillsSection,
    ),
  {
    loading: () => null,
  },
)

function SkillsSectionPlaceholder({ locale }: { locale: ResumeLocale }) {
  const labels = resumeLabels[locale]

  return (
    <PublishedResumeSectionCard
      description={
        locale === 'zh'
          ? '技能区将在接近视口时再加载图表与交互资源，先保证首屏内容更轻。'
          : 'The skills section loads its charting and interaction bundle only when it nears the viewport.'
      }
      eyebrow={labels.skillsEyebrow}
      title={labels.skillsTitle}>
      <div className="rounded-[24px] border border-slate-200/70 bg-slate-50/80 px-4 py-5 text-sm leading-6 text-slate-500 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-400">
        {locale === 'zh' ? '正在准备技能区内容…' : 'Preparing skills section…'}
      </div>
    </PublishedResumeSectionCard>
  )
}

export function PublishedResumeShell({
  apiBaseUrl = DEFAULT_API_BASE_URL,
  publishedResume,
}: {
  apiBaseUrl?: string
  publishedResume: ResumePublishedSnapshot | null
}) {
  const [locale, setLocale] = useState<ResumeLocale>('zh')
  const [shouldRenderSkills, setShouldRenderSkills] = useState(() =>
    typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent),
  )
  const skillsViewportRef = useRef<HTMLDivElement | null>(null)

  if (!publishedResume) {
    return <PublishedResumeEmptyState />
  }

  const { education, experiences, projects, skills } = publishedResume.resume
  const sidebarStickyClass = 'lg:sticky lg:top-[5.5rem] lg:self-start'

  useEffect(() => {
    if (shouldRenderSkills || typeof window === 'undefined') {
      return
    }

    if (typeof IntersectionObserver === 'undefined') {
      setShouldRenderSkills(true)
      return
    }

    const target = skillsViewportRef.current

    if (!target) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const isVisible = entries.some(
          (entry) => entry.isIntersecting || entry.intersectionRatio > 0,
        )

        if (!isVisible) {
          return
        }

        setShouldRenderSkills(true)
        observer.disconnect()
      },
      {
        rootMargin: '420px 0px',
        threshold: 0.01,
      },
    )

    observer.observe(target)

    return () => {
      observer.disconnect()
    }
  }, [shouldRenderSkills])

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
            <div ref={skillsViewportRef}>
              {shouldRenderSkills ? (
                <PublishedResumeSkillsSection locale={locale} skills={skills} />
              ) : (
                <SkillsSectionPlaceholder locale={locale} />
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
