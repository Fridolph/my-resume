'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'

import { DEFAULT_API_BASE_URL } from '../../core/env'
import { ResumeLocale, ResumePublishedSnapshot } from './types/published-resume.types'
import { PublishedResumeEducationSection } from './published-resume-education-section'
import { PublishedResumeEmptyState } from './published-resume-empty-state'
import { PublishedResumeHero } from './published-resume-hero'
import { PublishedResumeLoadingState } from './published-resume-loading-state'
import { PublishedResumeSectionCard } from './published-resume-section-card'
import { resumeLabels } from './published-resume-utils'
import { fetchPublishedResume } from './services/published-resume-api'
import { PublicSiteHeader } from '../site/site-header'

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

interface DeferredSectionPlaceholderProps {
  description: string
  eyebrow: string
  locale: ResumeLocale
  pendingText: {
    en: string
    zh: string
  }
  title: string
}

function DeferredSectionPlaceholder({
  description,
  eyebrow,
  locale,
  pendingText,
  title,
}: DeferredSectionPlaceholderProps) {
  return (
    <PublishedResumeSectionCard description={description} eyebrow={eyebrow} title={title}>
      <div className="rounded-[24px] border border-slate-200/70 bg-slate-50/80 px-4 py-5 text-sm leading-6 text-slate-500 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-400">
        {locale === 'zh' ? pendingText.zh : pendingText.en}
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
  enableClientSync = false,
  publishedResume,
  syncPublishedResume = fetchPublishedResume,
}: {
  apiBaseUrl?: string
  enableClientSync?: boolean
  publishedResume: ResumePublishedSnapshot | null
  syncPublishedResume?: typeof fetchPublishedResume
}) {
  const [locale, setLocale] = useState<ResumeLocale>('zh')
  const [currentPublishedResume, setCurrentPublishedResume] = useState(publishedResume)
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'error'>('idle')
  const [syncMessage, setSyncMessage] = useState<string | null>(null)
  const isJsdom = typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent)
  const labels = resumeLabels[locale]
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
    rootMargin: '420px 0px',
  })

  useEffect(() => {
    setCurrentPublishedResume(publishedResume)
  }, [publishedResume])

  useEffect(() => {
    if (!enableClientSync) {
      return
    }

    let cancelled = false
    setSyncState('syncing')
    setSyncMessage(null)

    syncPublishedResume({
      apiBaseUrl,
    })
      .then((nextSnapshot) => {
        if (cancelled) {
          return
        }

        setCurrentPublishedResume((currentSnapshot) => {
          if (!nextSnapshot) {
            return currentSnapshot
          }

          if (!currentSnapshot) {
            return nextSnapshot
          }

          const currentPublishedAt = Date.parse(currentSnapshot.publishedAt)
          const nextPublishedAt = Date.parse(nextSnapshot.publishedAt)

          if (Number.isNaN(currentPublishedAt) || Number.isNaN(nextPublishedAt)) {
            return nextSnapshot
          }

          return nextPublishedAt > currentPublishedAt ? nextSnapshot : currentSnapshot
        })
        setSyncState('idle')
      })
      .catch((error) => {
        if (cancelled) {
          return
        }

        setSyncState('error')
        setSyncMessage(error instanceof Error ? error.message : '公开简历同步失败')
      })

    return () => {
      cancelled = true
    }
  }, [apiBaseUrl, enableClientSync, syncPublishedResume])

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
        onChangeLocale={setLocale}
      />

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6">
        {syncState === 'syncing' ? (
          <div className="rounded-[16px] border border-slate-200/70 bg-slate-50/80 px-4 py-3 text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
            正在后台同步最新发布快照...
          </div>
        ) : null}
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
                  description={labels.experienceDescription}
                  eyebrow={labels.experienceEyebrow}
                  locale={locale}
                  pendingText={{
                    zh: '正在准备工作经历区内容…',
                    en: 'Preparing experience section…',
                  }}
                  title={labels.experienceTitle}
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
                  description={labels.projectsDescription}
                  eyebrow={labels.projectsEyebrow}
                  locale={locale}
                  pendingText={{
                    zh: '正在准备项目区内容…',
                    en: 'Preparing projects section…',
                  }}
                  title={labels.projectsTitle}
                />
              )}
            </div>
            <div ref={skillsSection.viewportRef}>
              {skillsSection.shouldRender ? (
                <DeferredPublishedResumeSkillsSection locale={locale} skills={skills} />
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
