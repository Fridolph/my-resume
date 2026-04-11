'use client'

import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'

import { DEFAULT_API_BASE_URL } from '@core/env'
import { usePublishedResumeSync } from '@shared/published-resume/hooks/use-published-resume-sync'
import { PublishedResumeEmptyState } from '@shared/published-resume/published-resume-empty-state'
import { PublishedResumeLoadingState } from '@shared/published-resume/published-resume-loading-state'
import { createFetchPublishedResumeMethod } from '@shared/published-resume/services/published-resume-api'
import { PublicSiteHeader } from '@shared/site/site-header'
import { PublishedResumeEducationSection } from './published-resume-education-section'
import { PublishedResumeHero } from './published-resume-hero'
import { PublishedResumeSectionCard } from './published-resume-section-card'
import type {
  ResumeLocale,
  ResumePublishedSnapshot,
} from '@shared/published-resume/types/published-resume.types'

const DeferredPublishedResumeExperienceSection = dynamic(
  () =>
    import('./published-resume-experience-section').then(
      (module) => module.PublishedResumeExperienceSection,
    ),
  {
    loading: () => null,
  },
)

const DeferredPublishedResumeProjectsSection = dynamic(
  () =>
    import('./published-resume-projects-section').then(
      (module) => module.PublishedResumeProjectsSection,
    ),
  {
    loading: () => null,
  },
)

const DeferredPublishedResumeSkillsSection = dynamic(
  () =>
    import('./published-resume-skills-section').then(
      (module) => module.PublishedResumeSkillsSection,
    ),
  {
    loading: () => null,
  },
)

function SkillsSectionPlaceholder() {
  const t = useTranslations('publishedResume')

  return (
    <PublishedResumeSectionCard
      description={t('skills.deferDescription')}
      eyebrow={t('skills.eyebrow')}
      title={t('skills.title')}>
      <div className="grid gap-4" aria-hidden="true">
        <div className="flex flex-col gap-3 md:items-end">
          <div className="flex flex-wrap gap-3 md:justify-end">
            <div className="h-11 w-28 rounded-full border border-slate-200/80 bg-slate-100/90 dark:border-white/10 dark:bg-white/5" />
            <div className="h-11 w-28 rounded-full border border-slate-200/80 bg-slate-100/90 dark:border-white/10 dark:bg-white/5" />
          </div>
          <div className="h-11 w-40 rounded-full border border-slate-200/80 bg-slate-100/90 dark:border-white/10 dark:bg-white/5" />
        </div>

        <div className="grid gap-4 md:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
          <div className="grid gap-4">
            <div className="min-h-[360px] rounded-[28px] border border-slate-200/80 bg-slate-50/80 p-5 dark:border-white/10 dark:bg-slate-900/60">
              <div className="h-full min-h-[320px] rounded-[24px] bg-slate-100/90 dark:bg-white/5" />
            </div>
            <div className="rounded-[28px] border border-slate-200/80 bg-slate-50/80 p-5 dark:border-white/10 dark:bg-slate-900/60">
              <div className="flex flex-wrap gap-3">
                {Array.from({ length: 9 }).map((_, index) => (
                  <div
                    className="h-11 rounded-full bg-slate-100/90 dark:bg-white/5"
                    key={`skills-token-${index}`}
                    style={{
                      width: `${88 + (index % 3) * 24}px`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-slate-900/60">
            <div className="grid gap-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  className="rounded-[20px] border border-slate-200/70 bg-white/80 p-4 dark:border-white/10 dark:bg-white/5"
                  key={`skills-legend-${index}`}>
                  <div className="mb-3 h-4 w-20 rounded-full bg-slate-100/90 dark:bg-white/5" />
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: 3 }).map((_, tokenIndex) => (
                      <div
                        className="h-8 rounded-full bg-slate-100/90 dark:bg-white/5"
                        key={`skills-legend-${index}-${tokenIndex}`}
                        style={{
                          width: `${60 + tokenIndex * 18}px`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-dashed border-slate-200/80 bg-slate-50/70 px-4 py-3 text-sm leading-6 text-slate-500 dark:border-white/10 dark:bg-slate-900/40 dark:text-slate-400">
          {t('skills.pending')}
        </div>
      </div>
    </PublishedResumeSectionCard>
  )
}

interface DeferredSectionPlaceholderProps {
  description: string
  eyebrow: string
  pendingText: string
  title: string
}

function DeferredSectionPlaceholder({
  description,
  eyebrow,
  pendingText,
  title,
}: DeferredSectionPlaceholderProps) {
  return (
    <PublishedResumeSectionCard description={description} eyebrow={eyebrow} title={title}>
      <div className="rounded-[24px] border border-slate-200/70 bg-slate-50/80 px-4 py-5 text-sm leading-6 text-slate-500 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-400">
        {pendingText}
      </div>
    </PublishedResumeSectionCard>
  )
}

function useDeferredSection({
  isJsdom,
  rootMargin,
}: {
  isJsdom: boolean
  rootMargin: string
}) {
  const [shouldRender, setShouldRender] = useState(() => isJsdom)
  const viewportRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (shouldRender || typeof window === 'undefined') {
      return
    }

    if (typeof IntersectionObserver === 'undefined') {
      setShouldRender(true)
      return
    }

    const target = viewportRef.current

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

        setShouldRender(true)
        observer.disconnect()
      },
      {
        rootMargin,
        threshold: 0.01,
      },
    )

    observer.observe(target)

    return () => {
      observer.disconnect()
    }
  }, [rootMargin, shouldRender])

  return {
    shouldRender,
    viewportRef,
  }
}

/**
 * 公开站主展示壳负责承接 published snapshot，并组织语言切换与模块渲染顺序
 *
 * @param apiBaseUrl 当前公开站访问的 API 基地址
 * @param publishedResume 已发布简历快照
 * @returns 公开站主展示区域
 */
export function PublishedResumeShell({
  apiBaseUrl = DEFAULT_API_BASE_URL,
  createSyncPublishedResumeMethod = createFetchPublishedResumeMethod,
  enableClientSync = false,
  locale = 'zh',
  publishedResume,
}: {
  apiBaseUrl?: string
  createSyncPublishedResumeMethod?: typeof createFetchPublishedResumeMethod
  enableClientSync?: boolean
  locale?: ResumeLocale
  publishedResume: ResumePublishedSnapshot | null
}) {
  const t = useTranslations('publishedResume')
  const { currentPublishedResume, syncState, syncMessage } = usePublishedResumeSync({
    apiBaseUrl,
    createSyncPublishedResumeMethod,
    enableClientSync,
    publishedResume,
  })
  const isJsdom = typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent)
  const experienceSection = useDeferredSection({
    isJsdom,
    rootMargin: '180px 0px',
  })
  const projectsSection = useDeferredSection({
    isJsdom,
    rootMargin: '280px 0px',
  })
  const skillsSection = useDeferredSection({
    isJsdom,
    rootMargin: '640px 0px',
  })

  if (!currentPublishedResume && syncState === 'syncing') {
    return <PublishedResumeLoadingState />
  }

  if (!currentPublishedResume) {
    return <PublishedResumeEmptyState />
  }

  const { education, experiences, projects, skills } = currentPublishedResume.resume
  const sidebarStickyClass = 'lg:sticky lg:top-[5.5rem] lg:self-start'

  return (
    <main className="web-page-shell" data-template="standard">
      <PublicSiteHeader
        apiBaseUrl={apiBaseUrl}
        deferActionsUntilIdle
        locale={locale}
      />

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6">
        {syncState === 'error' && syncMessage ? (
          <div className="rounded-[16px] border border-red-200/70 bg-red-50/80 px-4 py-3 text-sm text-red-600 dark:border-red-500/35 dark:bg-red-500/10 dark:text-red-300">
            {syncMessage}
          </div>
        ) : null}
        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className={sidebarStickyClass}>
            <PublishedResumeHero
              locale={locale}
              publishedResume={currentPublishedResume}
            />
          </aside>

          <div className="grid gap-6">
            <PublishedResumeEducationSection education={education} locale={locale} />
            <div ref={experienceSection.viewportRef}>
              {experienceSection.shouldRender ? (
                <DeferredPublishedResumeExperienceSection
                  experiences={experiences}
                  locale={locale}
                />
              ) : (
                <DeferredSectionPlaceholder
                  description={t('experience.description')}
                  eyebrow={t('experience.eyebrow')}
                  pendingText={t('experience.pending')}
                  title={t('experience.title')}
                />
              )}
            </div>
            <div ref={projectsSection.viewportRef}>
              {projectsSection.shouldRender ? (
                <DeferredPublishedResumeProjectsSection
                  locale={locale}
                  projects={projects}
                />
              ) : (
                <DeferredSectionPlaceholder
                  description={t('projects.description')}
                  eyebrow={t('projects.eyebrow')}
                  pendingText={t('projects.pending')}
                  title={t('projects.title')}
                />
              )}
            </div>
            <div ref={skillsSection.viewportRef}>
              {skillsSection.shouldRender ? (
                <DeferredPublishedResumeSkillsSection locale={locale} skills={skills} />
              ) : (
                <SkillsSectionPlaceholder />
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
