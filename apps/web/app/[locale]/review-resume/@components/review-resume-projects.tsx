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
        <div className="mb-5 grid gap-1 last:mb-0" data-entry key={i}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <strong className="text-sm text-zinc-900">
              {t(proj.name, locale)}
              {proj.links.length > 0 ? (
                <a
                  className="ml-2 align-middle text-xs font-normal text-blue-500 hover:underline"
                  href={proj.links[0].url}
                  rel="noreferrer"
                  target="_blank">
                  ↗
                </a>
              ) : null}
            </strong>
            <span className="text-xs text-zinc-400">
              {proj.startDate}
              {proj.endDate ? ` - ${proj.endDate}` : ''}
            </span>
          </div>
          <span className="text-xs text-zinc-500">
            {t(proj.role, locale)}
          </span>
          {proj.summary && t(proj.summary, locale) ? (
            <p className="text-sm leading-6 text-zinc-600">
              {t(proj.summary, locale)}
            </p>
          ) : null}
          {proj.coreFunctions ? (
            <p className="text-sm leading-6 text-zinc-600">
              {proj.coreFunctions}
            </p>
          ) : null}
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
