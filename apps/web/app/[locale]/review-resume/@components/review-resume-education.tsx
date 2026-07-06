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
        <div className="grid gap-0.5" key={i}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <strong className="text-sm text-zinc-900">
              {t(edu.schoolName, locale)} · {t(edu.degree, locale)}{' '}
              {t(edu.fieldOfStudy, locale)}
            </strong>
            <span className="text-xs text-zinc-400">
              {edu.startDate} - {edu.endDate}
            </span>
          </div>
          <span className="text-xs text-zinc-500">
            {t(edu.location, locale)}
          </span>
        </div>
      ))}
    </ResumeSection>
  )
}
