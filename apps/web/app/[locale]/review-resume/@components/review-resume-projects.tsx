import type { ResumeProject, ReviewLocale } from '../review-resume.types'
import { t } from '../review-resume.types'
import { ResumeSection } from './resume-section'

interface Props {
  items: ResumeProject[]
  locale: ReviewLocale
}

export function ReviewResumeProjects({ items, locale }: Props) {
  if (items.length === 0) return null

  return (
    <ResumeSection title={locale === 'en' ? 'Projects' : '项目经历'}>
      {items.map((proj, i) => (
        <div className="grid gap-1" key={i}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <strong className="text-sm text-zinc-900">
              {t(proj.name, locale)}
            </strong>
            <span className="text-xs text-zinc-400">
              {proj.startDate} - {proj.endDate || '至今'}
            </span>
          </div>
          <span className="text-xs text-zinc-500">
            {t(proj.role, locale)}
          </span>
          <p className="text-sm leading-6 text-zinc-600">
            {t(proj.summary, locale)}
          </p>
          {proj.highlights.length > 0 ? (
            <ul className="ml-4 grid gap-0.5 text-sm leading-6 text-zinc-600">
              {proj.highlights.map((h, j) => (
                <li className="list-disc" key={j}>
                  {t(h, locale)}
                </li>
              ))}
            </ul>
          ) : null}
          {proj.technologies.length > 0 ? (
            <p className="text-xs text-zinc-400">
              {proj.technologies.join(' · ')}
            </p>
          ) : null}
        </div>
      ))}
    </ResumeSection>
  )
}
