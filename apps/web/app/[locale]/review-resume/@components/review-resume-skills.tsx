import type { ResumeSkill, ReviewLocale } from '../review-resume.types'
import { t } from '../review-resume.types'
import { ResumeSection } from './resume-section'

interface Props {
  items: ResumeSkill[]
  locale: ReviewLocale
}

export function ReviewResumeSkills({ items, locale }: Props) {
  if (items.length === 0) return null

  return (
    <ResumeSection title={locale === 'en' ? 'Skills' : '专业技能'}>
      {items.map((sk, i) => (
        <div className="mb-3 grid gap-1 last:mb-0" data-entry key={i}>
          <div className="flex flex-wrap items-baseline gap-2">
            <strong className="text-sm text-zinc-900">
              {t(sk.name, locale)}
            </strong>
          </div>
          <ul className="ml-4 grid gap-0.5 text-sm leading-6 text-zinc-600">
            {sk.keywords.map((k, j) => (
              <li className="list-disc" key={j}>
                {t(k, locale)}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </ResumeSection>
  )
}
