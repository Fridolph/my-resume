import type { ResumeExperience, ReviewLocale } from '../review-resume.types'
import { t } from '../review-resume.types'
import { ResumeSection } from './resume-section'

interface Props {
  items: ResumeExperience[]
  locale: ReviewLocale
}

export function ReviewResumeExperience({ items, locale }: Props) {
  if (items.length === 0) return null

  return (
    <ResumeSection title={locale === 'en' ? 'Work Experience' : '工作经历'}>
      {items.map((exp, i) => (
        <div className="grid gap-1" key={i}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <strong className="text-sm text-zinc-900">
              {t(exp.companyName, locale)}
            </strong>
            <span className="text-xs text-zinc-400">
              {exp.startDate} - {exp.endDate || '至今'}
            </span>
          </div>
          <span className="text-xs text-zinc-500">
            {t(exp.role, locale)}
            {exp.location ? ` · ${t(exp.location, locale)}` : ''}
          </span>
          <p className="text-sm leading-6 text-zinc-600">
            {t(exp.summary, locale)}
          </p>
          {exp.highlights.length > 0 ? (
            <ul className="ml-4 grid gap-0.5 text-sm leading-6 text-zinc-600">
              {exp.highlights.map((h, j) => (
                <li className="list-disc" key={j}>
                  {t(h, locale)}
                </li>
              ))}
            </ul>
          ) : null}
          {exp.technologies.length > 0 ? (
            <p className="text-xs text-zinc-400">
              {exp.technologies.join(' · ')}
            </p>
          ) : null}
        </div>
      ))}
    </ResumeSection>
  )
}
