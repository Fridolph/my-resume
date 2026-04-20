'use client'

import { formatDateRange } from '@my-resume/utils'
import { useTranslations } from 'next-intl'

import type {
  ResumeEducationItem,
  ResumeLocale,
} from '@shared/published-resume/types/published-resume.types'
import { readLocalizedText } from '@shared/published-resume/published-resume-utils'
import { createIndexedRenderKey } from './published-resume-render-key'
import { PublishedResumeSectionCard } from './published-resume-section-card'

interface PublishedResumeEducationSectionProps {
  locale: ResumeLocale
  education: ResumeEducationItem[]
}

export function PublishedResumeEducationSection({
  locale,
  education,
}: PublishedResumeEducationSectionProps) {
  const t = useTranslations('publishedResume')

  if (education.length === 0) {
    return null
  }

  return (
    <PublishedResumeSectionCard
      eyebrow={t('education.eyebrow')}
      title={t('education.title')}>
      <div className="grid gap-0 divide-y divide-slate-200/70 dark:divide-white/8">
        {education.map((item, educationIndex) => {
          const educationKey = createIndexedRenderKey(educationIndex, [
            item.schoolName.zh,
            item.schoolName.en,
            item.startDate,
            item.endDate,
          ])

          return (
            <article
              className="grid gap-4 px-1 py-5 sm:px-2 sm:py-6"
              data-testid="resume-education-item"
              key={educationKey}>
              <div className="grid gap-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-1.5">
                    <h3 className="text-[20px] font-bold tracking-tight text-slate-950 dark:text-white">
                      {readLocalizedText(item.schoolName, locale)}
                    </h3>
                    <p className="text-base leading-7 text-slate-500 dark:text-slate-300">
                      {readLocalizedText(item.degree, locale)} /{' '}
                      {readLocalizedText(item.fieldOfStudy, locale)}
                    </p>
                  </div>
                  <span className="text-base font-medium text-slate-500 dark:text-slate-400">
                    {formatDateRange(item, locale)}
                  </span>
                </div>

                {readLocalizedText(item.location, locale) ? (
                  <p className="text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">
                    {readLocalizedText(item.location, locale)}
                  </p>
                ) : null}

                {item.highlights.length > 0 ? (
                  <ul className="grid gap-2 pl-5 text-sm leading-7 text-slate-600 dark:text-slate-300">
                    {item.highlights.map((highlight, highlightIndex) => (
                      <li
                        key={createIndexedRenderKey(highlightIndex, [
                          educationKey,
                          highlight.zh,
                          highlight.en,
                        ])}>
                        {readLocalizedText(highlight, locale)}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </article>
          )
        })}
      </div>
    </PublishedResumeSectionCard>
  )
}
