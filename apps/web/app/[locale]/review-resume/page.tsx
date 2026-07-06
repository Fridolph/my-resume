'use client'

import './review-resume.css'

import { useEffect, useRef, useState } from 'react'

import { useResumePdfExport } from '@shared/resume/use-resume-pdf-export'

import { ReviewResumeEducation } from './@components/review-resume-education'
import { ReviewResumeExperience } from './@components/review-resume-experience'
import { ReviewResumeProfile } from './@components/review-resume-profile'
import { ReviewResumeProjects } from './@components/review-resume-projects'
import { ReviewResumeSkills } from './@components/review-resume-skills'
import { ResumeSection } from './@components/resume-section'
import type {
  PublishedResumeApiResponse,
  ResumeData,
  ResumeHighlight,
  ResumeInterest,
  ReviewLocale,
} from './review-resume.types'
import { t } from './review-resume.types'

const API_BASE =
  typeof window !== 'undefined'
    ? window.location.origin.replace(':5555', ':5577') + '/api'
    : ''

const A4_WIDTH = 794 // px at 96dpi

export default function ReviewResumePage() {
  const [resume, setResume] = useState<ResumeData | null>(null)
  const [locale, setLocale] = useState<ReviewLocale>('zh')
  const [exporting, setExporting] = useState(false)
  const pageRef = useRef<HTMLDivElement>(null)
  const { exportPdf } = useResumePdfExport()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const lang = params.get('locale')
    if (lang === 'en' || lang === 'zh') setLocale(lang)
  }, [])

  useEffect(() => {
    fetch(`${API_BASE}/resume/published`)
      .then((r) => r.json())
      .then((json) => {
        // API 返回 { code, data: { resume: {...} } }
        const api = json as PublishedResumeApiResponse
        setResume(api.data?.resume ?? null)
      })
      .catch(() => {})
  }, [])

  function handleExport() {
    if (!pageRef.current || exporting) return
    setExporting(true)
    const fileName = `简历_FYS_${locale === 'en' ? 'EN' : 'ZH'}.pdf`
    exportPdf(pageRef.current, fileName).finally(() => setExporting(false))
  }

  if (!resume) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-zinc-400">
        加载中...
      </div>
    )
  }

  const p = resume.profile

  return (
    <>
      {/* ── 工具栏：打印/PDF 时隐藏 ── */}
      <div className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-zinc-200 bg-white/90 px-6 py-3 backdrop-blur print:hidden">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-zinc-700">
            {locale === 'en' ? 'Resume Preview' : '简历预览'}
          </span>
          <span className="text-xs text-zinc-400">|</span>
          <button
            className="rounded px-2 py-1 text-xs font-medium transition"
            onClick={() => setLocale('zh')}
            style={{
              background: locale === 'zh' ? '#1d4ed8' : 'transparent',
              color: locale === 'zh' ? '#fff' : '#64748b',
            }}>
            中文
          </button>
          <button
            className="rounded px-2 py-1 text-xs font-medium transition"
            onClick={() => setLocale('en')}
            style={{
              background: locale === 'en' ? '#1d4ed8' : 'transparent',
              color: locale === 'en' ? '#fff' : '#64748b',
            }}>
            EN
          </button>
        </div>

        <button
          className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-50"
          disabled={exporting}
          onClick={handleExport}>
          <DownloadIcon />
          {exporting
            ? locale === 'en'
              ? 'Generating...'
              : '生成中...'
            : locale === 'en'
              ? 'Download PDF'
              : '下载 PDF'}
        </button>
      </div>

      {/* ── A4 简历内容 ── */}
      <div className="min-h-screen bg-zinc-200 py-8 print:bg-white print:py-0">
        <div
          ref={pageRef}
          className="review-resume-page mx-auto w-full bg-white shadow-lg print:shadow-none"
          style={{ maxWidth: `${A4_WIDTH}px` }}>
          {/* 基本信息 */}
          <ReviewResumeProfile profile={p} locale={locale} />

          <main className="px-14 py-6">
            {/* 核心竞争力 */}
            {resume.highlights.length > 0 ? (
              <ResumeSection
                title={locale === 'en' ? 'Key Strengths' : '核心竞争力'}>
                <ul className="grid gap-1.5">
                  {resume.highlights.map((h: ResumeHighlight, i: number) => (
                    <li className="text-sm leading-6 text-zinc-700" key={i}>
                      <strong className="text-zinc-900">
                        {t(h.title, locale)}
                      </strong>
                      <span className="mx-1 text-zinc-300">—</span>
                      {t(h.description, locale)}
                    </li>
                  ))}
                </ul>
              </ResumeSection>
            ) : null}

            {/* 教育 */}
            <ReviewResumeEducation
              items={resume.education}
              locale={locale}
            />

            {/* 技能 */}
            <ReviewResumeSkills items={resume.skills} locale={locale} />

            {/* 工作经历 */}
            <ReviewResumeExperience
              items={resume.experiences}
              locale={locale}
            />

            {/* 项目 */}
            <ReviewResumeProjects
              items={resume.projects}
              locale={locale}
            />

            {/* 兴趣爱好 */}
            {p.interests.length > 0 ? (
              <ResumeSection
                title={locale === 'en' ? 'Interests' : '兴趣爱好'}>
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-zinc-600">
                  {p.interests.map((item: ResumeInterest, i: number) => (
                    <span key={i}>
                      {item.icon ? `${item.icon} ` : ''}
                      {t(item.label, locale)}
                    </span>
                  ))}
                </div>
              </ResumeSection>
            ) : null}

            {/* 致谢 */}
            <ResumeSection
              title={locale === 'en' ? 'Acknowledgement' : '致谢'}>
              <p className="text-sm leading-6 text-zinc-500">
                {locale === 'en'
                  ? 'Thank you for taking the time to review my resume. I look forward to the opportunity to discuss how my experience can contribute to your team.'
                  : '感谢您花时间阅读我的简历，期待有机会进一步交流。'}
              </p>
            </ResumeSection>
          </main>
        </div>
      </div>
    </>
  )
}

function DownloadIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      height="16"
      viewBox="0 0 24 24"
      width="16">
      <path
        d="M12 3V14M12 14L8 10M12 14L16 10M5 18H19"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}
