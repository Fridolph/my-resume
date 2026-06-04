'use client'

import { useEffect, useState } from 'react'

const API_BASE =
  typeof window !== 'undefined'
    ? window.location.origin.replace(':5555', ':5577') + '/api'
    : ''

interface LocalizedText {
  zh: string
  en: string
}

interface ResumeInterest {
  label: LocalizedText
  icon?: string
}

interface ResumeLink {
  label: LocalizedText
  url: string
}

interface ResumeHighlight {
  title: LocalizedText
  description: LocalizedText
}

interface ResumeEducation {
  schoolName: LocalizedText
  degree: LocalizedText
  fieldOfStudy: LocalizedText
  startDate: string
  endDate: string
  location: LocalizedText
}

interface ResumeSkill {
  name: LocalizedText
  keywords: LocalizedText[]
  proficiency?: number
}

interface ResumeExperience {
  companyName: LocalizedText
  role: LocalizedText
  startDate: string
  endDate: string
  location: LocalizedText
  summary: LocalizedText
  highlights: LocalizedText[]
  technologies: string[]
}

interface ResumeProject {
  name: LocalizedText
  role: LocalizedText
  startDate: string
  endDate: string
  summary: LocalizedText
  highlights: LocalizedText[]
  technologies: string[]
}

interface ResumeProfile {
  fullName: LocalizedText
  headline: LocalizedText
  summary: LocalizedText
  location: LocalizedText
  email: string
  phone: string
  website: string
  interests: ResumeInterest[]
  links: ResumeLink[]
}

interface PublishedResume {
  resume: {
    profile: ResumeProfile
    highlights: ResumeHighlight[]
    education: ResumeEducation[]
    skills: ResumeSkill[]
    experiences: ResumeExperience[]
    projects: ResumeProject[]
  }
}

function t(v: LocalizedText, locale: string) {
  return locale === 'en' ? (v.en || v.zh) : v.zh
}

const A4_WIDTH = 794 // px at 96dpi
const PAGE_CLASS =
  'mx-auto w-full bg-white shadow-lg'

export default function ReviewPdfPage() {
  const [data, setData] = useState<PublishedResume | null>(null)
  const [locale, setLocale] = useState('zh')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const lang = params.get('locale')
    if (lang === 'en' || lang === 'zh') setLocale(lang)
  }, [])

  useEffect(() => {
    fetch(`${API_BASE}/resume/published`)
      .then((r) => r.json())
      .then((json) => {
        const d = json.data ?? json
        setData(d)
      })
      .catch(() => {})
  }, [])

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-zinc-400">
        加载中...
      </div>
    )
  }

  const p = data.resume.profile
  const l = (v: LocalizedText) => t(v, locale)

  return (
    <div className="min-h-screen bg-zinc-200 py-8 print:bg-white print:py-0">
      <div
        className={PAGE_CLASS}
        style={{ maxWidth: `${A4_WIDTH}px`, minHeight: '1123px' }}>
        {/* 基本信息 */}
        <header className="border-b-2 border-zinc-900 px-14 pb-5 pt-10">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
            {l(p.fullName)}
          </h1>
          <p className="mt-2 text-base text-zinc-600">{l(p.headline)}</p>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-zinc-500">
            {p.email ? <span>{p.email}</span> : null}
            {p.phone ? <span>{p.phone}</span> : null}
            {p.website ? <span>{p.website}</span> : null}
            {p.location ? <span>{l(p.location)}</span> : null}
          </div>
          <p className="mt-3 text-sm leading-6 text-zinc-600">
            {l(p.summary)}
          </p>
        </header>

        <main className="px-14 py-6">
          {/* 核心竞争力 */}
          {data.resume.highlights.length > 0 ? (
            <Section title={locale === 'en' ? 'Key Strengths' : '核心竞争力'}>
              <ul className="grid gap-1.5">
                {data.resume.highlights.map((h, i) => (
                  <li className="text-sm leading-6 text-zinc-700" key={i}>
                    <strong className="text-zinc-900">{l(h.title)}</strong>
                    <span className="mx-1 text-zinc-300">—</span>
                    {l(h.description)}
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

          {/* 教育经历 */}
          {data.resume.education.length > 0 ? (
            <Section title={locale === 'en' ? 'Education' : '教育经历'}>
              {data.resume.education.map((edu, i) => (
                <div className="grid gap-0.5" key={i}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <strong className="text-sm text-zinc-900">
                      {l(edu.schoolName)} · {l(edu.degree)} {l(edu.fieldOfStudy)}
                    </strong>
                    <span className="text-xs text-zinc-400">
                      {edu.startDate} - {edu.endDate}
                    </span>
                  </div>
                  <span className="text-xs text-zinc-500">{l(edu.location)}</span>
                </div>
              ))}
            </Section>
          ) : null}

          {/* 专业技能 */}
          {data.resume.skills.length > 0 ? (
            <Section title={locale === 'en' ? 'Skills' : '专业技能'}>
              {data.resume.skills.map((sk, i) => (
                <div className="flex flex-wrap items-baseline gap-2" key={i}>
                  <strong className="text-sm text-zinc-900">{l(sk.name)}：</strong>
                  <span className="text-sm text-zinc-600">
                    {sk.keywords.map((k) => l(k)).join('、')}
                  </span>
                </div>
              ))}
            </Section>
          ) : null}

          {/* 工作经历 */}
          {data.resume.experiences.length > 0 ? (
            <Section title={locale === 'en' ? 'Work Experience' : '工作经历'}>
              {data.resume.experiences.map((exp, i) => (
                <div className="grid gap-1" key={i}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <strong className="text-sm text-zinc-900">
                      {l(exp.companyName)}
                    </strong>
                    <span className="text-xs text-zinc-400">
                      {exp.startDate} - {exp.endDate || '至今'}
                    </span>
                  </div>
                  <span className="text-xs text-zinc-500">
                    {l(exp.role)}{exp.location ? ` · ${l(exp.location)}` : ''}
                  </span>
                  <p className="text-sm leading-6 text-zinc-600">
                    {l(exp.summary)}
                  </p>
                  {exp.highlights.length > 0 ? (
                    <ul className="ml-4 grid gap-0.5 text-sm leading-6 text-zinc-600">
                      {exp.highlights.map((h, j) => (
                        <li className="list-disc" key={j}>
                          {l(h)}
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
            </Section>
          ) : null}

          {/* 项目经历 */}
          {data.resume.projects.length > 0 ? (
            <Section title={locale === 'en' ? 'Projects' : '项目经历'}>
              {data.resume.projects.map((proj, i) => (
                <div className="grid gap-1" key={i}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <strong className="text-sm text-zinc-900">
                      {l(proj.name)}
                    </strong>
                    <span className="text-xs text-zinc-400">
                      {proj.startDate} - {proj.endDate || '至今'}
                    </span>
                  </div>
                  <span className="text-xs text-zinc-500">{l(proj.role)}</span>
                  <p className="text-sm leading-6 text-zinc-600">
                    {l(proj.summary)}
                  </p>
                  {proj.highlights.length > 0 ? (
                    <ul className="ml-4 grid gap-0.5 text-sm leading-6 text-zinc-600">
                      {proj.highlights.map((h, j) => (
                        <li className="list-disc" key={j}>
                          {l(h)}
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
            </Section>
          ) : null}

          {/* 兴趣爱好 */}
          {p.interests.length > 0 ? (
            <Section title={locale === 'en' ? 'Interests' : '兴趣爱好'}>
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-zinc-600">
                {p.interests.map((item, i) => (
                  <span key={i}>
                    {item.icon ? `${item.icon} ` : ''}
                    {l(item.label)}
                  </span>
                ))}
              </div>
            </Section>
          ) : null}

          {/* 致谢 */}
          <Section title={locale === 'en' ? 'Acknowledgement' : '致谢'}>
            <p className="text-sm leading-6 text-zinc-500">
              {locale === 'en'
                ? 'Thank you for taking the time to review my resume. I look forward to the opportunity to discuss how my experience can contribute to your team.'
                : '感谢您花时间阅读我的简历，期待有机会进一步交流。'}
            </p>
          </Section>
        </main>
      </div>
    </div>
  )
}

function Section({
  children,
  title,
}: {
  children: React.ReactNode
  title: string
}) {
  return (
    <section className="mb-5 grid gap-2">
      <h2 className="border-b border-zinc-200 pb-1 text-base font-bold tracking-wide text-zinc-900">
        {title}
      </h2>
      {children}
    </section>
  )
}
