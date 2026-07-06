import type { ResumeProfile, ReviewLocale } from '../review-resume.types'
import { t } from '../review-resume.types'

interface Props {
  profile: ResumeProfile
  locale: ReviewLocale
}

export function ReviewResumeProfile({ profile: p, locale }: Props) {
  return (
    <header className="border-b-2 border-zinc-900 px-14 pb-5 pt-10" data-section="profile">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
        {t(p.fullName, locale)}
      </h1>
      <p className="mt-2 text-base text-zinc-600">{t(p.headline, locale)}</p>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-zinc-500">
        {p.email ? <span>{p.email}</span> : null}
        {p.phone ? <span>{p.phone}</span> : null}
        {p.website ? <span>{p.website}</span> : null}
        {p.location ? <span>{t(p.location, locale)}</span> : null}
      </div>
      <p className="mt-3 text-sm leading-6 text-zinc-600">
        {t(p.summary, locale)}
      </p>
    </header>
  )
}
