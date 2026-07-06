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
        <div className="flex flex-wrap items-baseline gap-2" key={i}>
          <strong className="text-sm text-zinc-900">
            {t(sk.name, locale)}：
          </strong>
          <span className="text-sm text-zinc-600">
            {sk.keywords.map((k) => t(k, locale)).join('、')}
          </span>
        </div>
      ))}
    </ResumeSection>
  )
}
