import { Tag, TagGroup } from '@heroui/react'

import { ResumeExperienceItem, ResumeLocale } from '../../lib/published-resume-types'
import { formatPeriod, readLocalizedText, resumeLabels } from './published-resume-utils'
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
  const labels = resumeLabels[locale]

  if (experiences.length === 0) {
    return null
  }

  return (
    <PublishedResumeSectionCard
      description={labels.experienceDescription}
      eyebrow={labels.experienceEyebrow}
      title={labels.experienceTitle}>
      <div className="grid gap-4">
        {experiences.map((experience) => {
          const companyName = readLocalizedText(experience.companyName, locale)
          const role = readLocalizedText(experience.role, locale)
          const employmentType = readLocalizedText(experience.employmentType, locale)
          const roleLine = [role, employmentType].filter(Boolean).join(' · ')
          const summary = readLocalizedText(experience.summary, locale)
          const location = readLocalizedText(experience.location, locale)

          return (
            <article
              className={timelineItemClass}
              key={`${experience.companyName.en}-${experience.startDate}`}>
              <div className={itemHeaderClass}>
                <div className={itemHeaderMainClass}>
                  <span
                    aria-hidden="true"
                    className="min-w-[3px] w-[3px] rounded-full bg-[linear-gradient(180deg,rgba(37,99,235,0.9),rgba(96,165,250,0.56))]"
                  />
                  <div className="grid gap-1.5">
                    <h3 className={itemTitleClass}>{companyName}</h3>
                    {roleLine ? <p className={itemMetaTextClass}>{roleLine}</p> : null}
                  </div>
                </div>
                <span className={itemMetaTextClass}>{formatPeriod(experience)}</span>
              </div>

              <div className="grid gap-4">
                {summary ? (
                  <div className={itemBlockClass}>
                    <p className={itemBlockLabelClass}>
                      {locale === 'zh' ? '职责概览' : 'Summary'}
                    </p>
                    <p className={itemSummaryClass}>{summary}</p>
                  </div>
                ) : null}
                {location ? (
                  <div className={itemBlockClass}>
                    <p className={itemBlockLabelClass}>
                      {locale === 'zh' ? '地点' : 'Location'}
                    </p>
                    <p className={itemSummaryClass}>{location}</p>
                  </div>
                ) : null}
              </div>

              {experience.highlights.length > 0 ? (
                <div className={itemBlockClass}>
                  <p className={itemBlockLabelClass}>
                    {locale === 'zh' ? '关键亮点' : 'Highlights'}
                  </p>
                  <ul className="my-2 grid gap-2.5 text-[14px] leading-[1.45] text-[#666666] dark:text-slate-300">
                    {experience.highlights.map((highlight) => (
                      <li key={`${experience.companyName.en}-${highlight.en}`}>
                        {readLocalizedText(highlight, locale)}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {experience.technologies.length > 0 ? (
                <div className={itemBlockClass}>
                  <p className={itemBlockLabelClass}>
                    {locale === 'zh' ? '技术栈' : 'Tech Stack'}
                  </p>
                  <TagGroup.Root aria-label={`${companyName} 技术栈`}>
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
