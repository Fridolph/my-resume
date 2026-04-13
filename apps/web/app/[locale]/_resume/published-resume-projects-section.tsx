'use client'

import { formatDateRange } from '@my-resume/utils'
import { Tag } from '@heroui/react/tag'
import { TagGroup } from '@heroui/react/tag-group'
import { DisplayPill } from '@my-resume/ui/display'
import { useTranslations } from 'next-intl'

import type {
  ResumeLocale,
  ResumeProjectItem,
} from '@shared/published-resume/types/published-resume.types'
import { readLocalizedText } from '@shared/published-resume/published-resume-utils'
import { createIndexedRenderKey } from './published-resume-render-key'
import { PublishedResumeSectionCard } from './published-resume-section-card'

const timelineItemClass =
  'grid gap-2 rounded-3xl border border-slate-400/25 bg-slate-50/82 p-5 dark:border-white/8 dark:bg-white/[0.04]'
const itemHeaderClass =
  'mb-2 flex flex-col items-start gap-3 md:flex-row md:justify-between'
const itemHeaderMainClass = 'flex w-full items-stretch gap-3.5 md:w-auto'
const itemTitleClass = 'm-0 text-[1.08rem] font-bold text-slate-900 dark:text-slate-50'
const itemMetaTextClass = 'text-slate-500 dark:text-slate-400'
const itemSummaryClass =
  'my-2 text-[14px] leading-[1.45] text-[#666666] dark:text-slate-300'
const itemBlockLabelClass =
  'm-0 text-[16px] font-semibold text-[#333333] dark:text-slate-100'
const itemBlockClass = 'grid gap-2'
const itemBadgeClass =
  'min-h-8 rounded-full px-[0.7rem] py-[0.42rem] text-[0.72rem] font-bold tracking-[0.04em]'
const itemTagClass =
  'min-h-[1.8rem] rounded-full border border-blue-200/90 bg-blue-50/90 px-2.5 py-[0.28rem] text-[0.68rem] font-bold leading-[1.2] text-blue-700 dark:border-blue-400/25 dark:bg-blue-600/12 dark:text-blue-200'

interface PublishedResumeProjectsSectionProps {
  locale: ResumeLocale
  projects: ResumeProjectItem[]
}

export function PublishedResumeProjectsSection({
  locale,
  projects,
}: PublishedResumeProjectsSectionProps) {
  const t = useTranslations('publishedResume')

  if (projects.length === 0) {
    return null
  }

  return (
    <PublishedResumeSectionCard
      description={t('projects.description')}
      eyebrow={t('projects.eyebrow')}
      title={t('projects.title')}>
      <div className="grid gap-4">
        {projects.map((project, projectIndex) => {
          const projectName = readLocalizedText(project.name, locale)
          const role = readLocalizedText(project.role, locale)
          const summary = readLocalizedText(project.summary, locale)
          const coreFunctions = readLocalizedText(project.coreFunctions, locale)
          const projectKey = createIndexedRenderKey(projectIndex, [
            project.name.zh,
            project.name.en,
            project.startDate,
            project.endDate,
          ])

          return (
            <article className={timelineItemClass} key={projectKey}>
              <div className={itemHeaderClass}>
                <div className={itemHeaderMainClass}>
                  <span
                    aria-hidden="true"
                    className="min-w-[3px] w-[3px] rounded-full bg-[linear-gradient(180deg,rgba(37,99,235,0.9),rgba(96,165,250,0.56))]"
                  />
                  <div className="grid gap-1.5">
                    <h3 className={itemTitleClass}>{projectName}</h3>
                    {role ? <p className={itemMetaTextClass}>{role}</p> : null}
                  </div>
                </div>
                <span className={itemMetaTextClass}>{formatDateRange(project)}</span>
              </div>

              {summary ? (
                <div className={itemBlockClass}>
                  <p className={itemBlockLabelClass}>{t('projects.summaryLabel')}</p>
                  <p className={itemSummaryClass}>{summary}</p>
                </div>
              ) : null}

              {coreFunctions ? (
                <div className={itemBlockClass}>
                  <p className={itemBlockLabelClass}>{t('projects.coreFunctionsLabel')}</p>
                  <p className={itemSummaryClass}>{coreFunctions}</p>
                </div>
              ) : null}

              {project.highlights.length > 0 ? (
                <div className={itemBlockClass}>
                  <p className={itemBlockLabelClass}>{t('projects.highlightsLabel')}</p>
                  <ul className="my-2 grid gap-2.5 text-[14px] leading-[1.45] text-[#666666] dark:text-slate-300">
                    {project.highlights.map((highlight, highlightIndex) => (
                      <li
                        key={createIndexedRenderKey(highlightIndex, [
                          projectKey,
                          highlight.zh,
                          highlight.en,
                        ])}>
                        {readLocalizedText(highlight, locale)}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {project.technologies.length > 0 ? (
                <div className={itemBlockClass}>
                  <p className={itemBlockLabelClass}>{t('projects.techStackLabel')}</p>
                  <TagGroup.Root
                    aria-label={t('projects.techStackAriaLabel', {
                      name: projectName,
                    })}>
                    <TagGroup.List
                      className="my-2 flex flex-wrap gap-2"
                      items={project.technologies.map((tech) => ({
                        id: tech,
                        label: tech,
                      }))}>
                      {(tech) => (
                        <Tag.Root
                          className={itemTagClass}
                          id={tech.id}
                          textValue={tech.label}>
                          {tech.label}
                        </Tag.Root>
                      )}
                    </TagGroup.List>
                  </TagGroup.Root>
                </div>
              ) : null}

              {project.links.length > 0 ? (
                <div className={itemBlockClass}>
                  <p className={itemBlockLabelClass}>{t('projects.linksLabel')}</p>
                  <div className="my-2 flex flex-wrap gap-2">
                    {project.links.map((link) => (
                      <DisplayPill
                        className={itemBadgeClass}
                        external
                        href={link.url}
                        key={link.url}>
                        {readLocalizedText(link.label, locale)}
                      </DisplayPill>
                    ))}
                  </div>
                </div>
              ) : null}
            </article>
          )
        })}
      </div>
    </PublishedResumeSectionCard>
  )
}
