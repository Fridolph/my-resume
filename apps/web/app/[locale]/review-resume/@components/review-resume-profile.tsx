import type { ResumeProfile, ReviewLocale } from '../review-resume.types'
import { t } from '../review-resume.types'

interface Props {
  profile: ResumeProfile
  locale: ReviewLocale
}

export function ReviewResumeProfile({ profile: p, locale }: Props) {
  const heroImage = p.hero?.frontImageUrl

  return (
    <header className="border-b-2 border-zinc-900" data-section="profile">
      {/* 头像行 */}
      <div className="flex items-start gap-6 px-14 pb-5 pt-10">
        {heroImage ? (
          <img
            alt={t(p.fullName, locale)}
            className="h-20 w-20 shrink-0 rounded-full border-2 border-zinc-200 object-cover"
            crossOrigin="anonymous"
            src={heroImage}
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
            {t(p.fullName, locale)}
          </h1>
          <p className="mt-1 text-base text-zinc-500">{t(p.headline, locale)}</p>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            {t(p.summary, locale)}
          </p>
        </div>
      </div>

      {/* 联系信息 */}
      <div className="flex flex-wrap gap-x-5 gap-y-1 border-t border-zinc-100 px-14 py-3 text-sm text-zinc-500">
        {p.email ? <span>{p.email}</span> : null}
        {p.phone ? <span>{p.phone}</span> : null}
        {p.website ? (
          <a
            className="text-zinc-500 underline-offset-2 hover:text-blue-600 hover:underline"
            href={p.website}
            rel="noreferrer"
            target="_blank">
            {p.website}
          </a>
        ) : null}
        {p.location ? <span>{t(p.location, locale)}</span> : null}
      </div>

      {/* 社交链接 */}
      {p.links.length > 0 ? (
        <div className="flex flex-wrap gap-x-5 gap-y-1 border-t border-zinc-100 px-14 py-3 text-sm text-zinc-400">
          {p.links.map((link, i) => (
            <a
              className="hover:text-blue-600"
              href={link.url}
              key={i}
              rel="noreferrer"
              target="_blank">
              {t(link.label, locale)}
            </a>
          ))}
        </div>
      ) : null}
    </header>
  )
}
