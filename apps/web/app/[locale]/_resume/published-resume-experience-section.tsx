'use client'

import { formatDateRange } from '@my-resume/utils'
import { Tag } from '@heroui/react/tag'
import { TagGroup } from '@heroui/react/tag-group'
import { useTranslations } from 'next-intl'

import type {
  ResumeExperienceItem,
  ResumeLocale,
} from '@shared/published-resume/types/published-resume.types'
import { readLocalizedText } from '@shared/published-resume/published-resume-utils'
import { createIndexedRenderKey } from './published-resume-render-key'
import surfaceStyles from './published-resume-card-surface.module.css'
import { PublishedResumeSectionCard } from './published-resume-section-card'

const timelineItemClass =
  `relative grid gap-2 rounded-3xl p-5 ${surfaceStyles.timelineCardSurface}`
const itemHeaderClass =
  'mb-2 flex flex-col items-start gap-3 md:flex-row md:items-start md:justify-between'
const itemHeaderMainClass = 'grid gap-1.5'
const itemTitleClass = 'm-0 text-[1.08rem] font-bold text-slate-900 dark:text-slate-50'
const itemMetaTextClass = 'text-slate-500 dark:text-slate-400'
const itemSummaryClass =
  'my-2 text-[14px] leading-[1.45] text-[#666666] dark:text-slate-300'
const itemBlockLabelClass =
  'm-0 text-[16px] font-semibold text-[#333333] dark:text-slate-100'
const itemBlockClass = 'grid gap-2'
const itemTagClass =
  'min-h-[1.8rem] rounded-full border border-blue-200/90 bg-blue-50/90 px-2.5 py-[0.28rem] text-[0.68rem] font-bold leading-[1.2] text-blue-700 dark:border-blue-400/25 dark:bg-blue-600/12 dark:text-blue-200'

interface PublishedResumeExperienceSectionProps {
  locale: ResumeLocale
  experiences: ResumeExperienceItem[]
}

export function PublishedResumeExperienceSection({
  locale,
  experiences,
}: PublishedResumeExperienceSectionProps) {
  const t = useTranslations('publishedResume')

  if (experiences.length === 0) {
    return null
  }

  return (
    <PublishedResumeSectionCard
      description={t('experience.description')}
      eyebrow={t('experience.eyebrow')}
      title={t('experience.title')}>
      <div className="grid gap-4">
        {experiences.map((experience, experienceIndex) => {
          const companyName = readLocalizedText(experience.companyName, locale)
          const role = readLocalizedText(experience.role, locale)
          const employmentType = readLocalizedText(experience.employmentType, locale)
          const roleLine = [role, employmentType].filter(Boolean).join(' · ')
          const summary = readLocalizedText(experience.summary, locale)
          const location = readLocalizedText(experience.location, locale)
          const experienceKey = createIndexedRenderKey(experienceIndex, [
            experience.companyName.zh,
            experience.companyName.en,
            experience.startDate,
            experience.endDate,
          ])

          return (
            <article className={timelineItemClass} key={experienceKey}>
              <span aria-hidden="true" className={surfaceStyles.timelineCardTab} />
              <div className={itemHeaderClass}>
                <div className={itemHeaderMainClass}>
                  <h3 className={itemTitleClass}>{companyName}</h3>
                  {roleLine ? <p className={itemMetaTextClass}>{roleLine}</p> : null}
                </div>
                <span className={itemMetaTextClass}>
                  {formatDateRange(experience, locale)}
                </span>
              </div>

              <div className="grid gap-4">
                {summary ? (
                  <div className={itemBlockClass}>
                    <p className={itemBlockLabelClass}>{t('experience.summaryLabel')}</p>
                    <p className={itemSummaryClass}>{summary}</p>
                  </div>
                ) : null}
                {location ? (
                  <div className={itemBlockClass}>
                    <p className={itemBlockLabelClass}>{t('experience.locationLabel')}</p>
                    <p className={itemSummaryClass}>{location}</p>
                  </div>
                ) : null}
              </div>

              {experience.highlights.length > 0 ? (
                <div className={itemBlockClass}>
                  <p className={itemBlockLabelClass}>{t('experience.highlightsLabel')}</p>
                  <ul className="my-2 grid gap-2.5 text-[14px] leading-[1.45] text-[#666666] dark:text-slate-300">
                    {experience.highlights.map((highlight, highlightIndex) => (
                      <li
                        key={createIndexedRenderKey(highlightIndex, [
                          experienceKey,
                          highlight.zh,
                          highlight.en,
                        ])}>
                        {readLocalizedText(highlight, locale)}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {experience.technologies.length > 0 ? (
                <div className={itemBlockClass}>
                  <p className={itemBlockLabelClass}>{t('experience.techStackLabel')}</p>
                  <TagGroup.Root
                    aria-label={t('experience.techStackAriaLabel', {
                      name: companyName,
                    })}>
                    <TagGroup.List
                      className="my-2 flex flex-wrap gap-2"
                      items={experience.technologies.map((tech) => ({
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
            </article>
          )
        })}
      </div>
    </PublishedResumeSectionCard>
  )
}
