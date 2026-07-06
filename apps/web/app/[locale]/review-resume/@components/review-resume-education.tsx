import type { ResumeEducation, ReviewLocale } from '../review-resume.types'
import { t } from '../review-resume.types'
import { ResumeSection } from './resume-section'

interface Props {
  items: ResumeEducation[]
  locale: ReviewLocale
}

export function ReviewResumeEducation({ items, locale }: Props) {
  if (items.length === 0) return null

  return (
    <ResumeSection title={locale === 'en' ? 'Education' : '教育经历'}>
      {items.map((edu, i) => (
        <div className="grid gap-1" key={i}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <strong className="text-sm text-zinc-900">
              {t(edu.schoolName, locale)}
            </strong>
            <span className="text-xs text-zinc-400">
              {edu.startDate} - {edu.endDate}
            </span>
          </div>
          <span className="text-xs text-zinc-500">
            {t(edu.degree, locale)} · {t(edu.fieldOfStudy, locale)}
            {edu.location && t(edu.location, locale)
              ? ` · ${t(edu.location, locale)}`
              : ''}
          </span>
          {edu.highlights.length > 0 ? (
            <ul className="ml-4 mt-0.5 grid gap-0.5 text-sm leading-6 text-zinc-600">
              {edu.highlights.map((h, j) => (
                <li className="list-disc" key={j}>
                  {t(h, locale)}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ))}
    </ResumeSection>
  )
}
