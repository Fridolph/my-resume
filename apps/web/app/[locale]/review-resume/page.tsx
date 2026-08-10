'use client'

import './review-resume.css'

import { joinApiUrl } from '@my-resume/api-client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

import { DEFAULT_API_BASE_URL } from '@core/env'

import { ReviewResumeEducation } from './@components/review-resume-education'
import { ReviewResumeExperience } from './@components/review-resume-experience'
import { ReviewResumeProfile } from './@components/review-resume-profile'
import { ReviewResumeProjects } from './@components/review-resume-projects'
import { ReviewResumeSkills } from './@components/review-resume-skills'
import { ResumeSection } from './@components/resume-section'
import type {
  PublishedResumeApiResponse,
  ResumeData,
  ReviewLocale,
} from './review-resume.types'
import { t } from './review-resume.types'

const A4_WIDTH = 794

function readInitialLocale(): ReviewLocale {
  if (typeof window === 'undefined') return 'zh'
  const queryLocale = new URLSearchParams(window.location.search).get('locale')
  if (queryLocale === 'en' || queryLocale === 'zh') return queryLocale
  const pathLocale = window.location.pathname.split('/').filter(Boolean)[0]
  return pathLocale === 'en' ? 'en' : 'zh'
}

export default function ReviewResumePage() {
  const [resume, setResume] = useState<ResumeData | null>(null)
  const [locale, setLocale] = useState<ReviewLocale>(() => readInitialLocale())
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const params = useParams<{ locale?: string }>()
  const routeLocale = params?.locale

  useEffect(() => {
    const queryLocale = new URLSearchParams(window.location.search).get('locale')
    if (queryLocale === 'en' || queryLocale === 'zh') {
      setLocale(queryLocale)
      return
    }
    if (routeLocale === 'en' || routeLocale === 'zh') {
      setLocale(routeLocale)
    }
  }, [routeLocale])

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setErrorMessage(null)

    const publishedResumeUrl = `${joinApiUrl(
      DEFAULT_API_BASE_URL,
      '/resume/published',
    )}?locale=${locale}`

    fetch(publishedResumeUrl, {
      cache: 'no-store',
      signal: controller.signal,
    })
      .then((r) => {
        if (!r.ok) {
          throw new Error(`Resume request failed: ${r.status}`)
        }
        return r.json()
      })
      .then((json) => {
        const api = json as PublishedResumeApiResponse
        setResume(api.data?.resume ?? null)
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setResume(null)
        setErrorMessage(
          error instanceof Error ? error.message : '公开简历读取失败',
        )
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      })

    return () => controller.abort()
  }, [locale])

  async function handleExport() {
    if (exporting) return
    setExporting(true)
    const name = resume
      ? t(resume.profile.fullName, locale).replace(/\s/g, '_')
      : 'FYS'
    const fileName = `简历_${name}_${locale === 'en' ? 'EN' : 'ZH'}.pdf`

    try {
      const pdfUrl = `${joinApiUrl(
        DEFAULT_API_BASE_URL,
        '/resume/published/export/pdf',
      )}?locale=${locale}`
      const response = await fetch(pdfUrl, { cache: 'no-store' })

      if (!response.ok) {
        throw new Error(`PDF request failed: ${response.status}`)
      }

      const pdfBlob = await response.blob()
      if (pdfBlob.size === 0) {
        throw new Error('PDF 文件为空，请稍后重试')
      }

      const objectUrl = URL.createObjectURL(pdfBlob)
      const downloadLink = document.createElement('a')
      downloadLink.href = objectUrl
      downloadLink.download = fileName
      downloadLink.style.display = 'none'
      document.body.append(downloadLink)
      downloadLink.click()
      downloadLink.remove()
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0)
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error ? error.message : 'PDF 生成失败，请稍后重试',
      )
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-zinc-400">
        {locale === 'en' ? 'Loading resume preview...' : '正在加载简历预览...'}
      </div>
    )
  }

  if (!resume) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-100 px-6 text-center">
        <div className="grid max-w-md gap-3 rounded-2xl bg-white p-8 shadow-sm">
          <h1 className="text-lg font-semibold text-zinc-900">
            {locale === 'en' ? 'Resume preview unavailable' : '简历预览暂不可用'}
          </h1>
          <p className="text-sm leading-6 text-zinc-500">
            {errorMessage ??
              (locale === 'en'
                ? 'No published resume is available yet.'
                : '当前还没有可预览的发布态简历。')}
          </p>
        </div>
      </div>
    )
  }

  const p = resume.profile

  return (
    <>
      {/* 工具栏 */}
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

      {errorMessage ? (
        <div className="border-b border-amber-200 bg-amber-50 px-6 py-2 text-center text-xs text-amber-800 print:hidden">
          {errorMessage}
        </div>
      ) : null}

      {/* A4 简历内容 */}
      <div className="min-h-screen overflow-x-auto bg-zinc-200 py-8 print:bg-white print:py-0">
        <div
          className="review-resume-page mx-auto w-full bg-white shadow-lg print:shadow-none"
          style={{ maxWidth: `${A4_WIDTH}px` }}>
          <ReviewResumeProfile profile={p} locale={locale} />

          <main className="px-14 py-6">
            {resume.highlights.length > 0 ? (
              <ResumeSection
                title={locale === 'en' ? 'Key Strengths' : '核心竞争力'}>
                <ul className="grid gap-1.5">
                  {resume.highlights.map((h, i) => (
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

            <ReviewResumeEducation
              items={resume.education}
              locale={locale}
            />

            <ReviewResumeSkills items={resume.skills} locale={locale} />

            <ReviewResumeExperience
              items={resume.experiences}
              locale={locale}
            />

            <ReviewResumeProjects
              items={resume.projects}
              locale={locale}
            />

            {p.interests.length > 0 ? (
              <ResumeSection
                title={locale === 'en' ? 'Interests' : '兴趣爱好'}>
                <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-zinc-500">
                  {p.interests.map((item, i) => (
                    <span key={i}>
                      {item.icon ? `${item.icon} ` : ''}
                      {t(item.label, locale)}
                    </span>
                  ))}
                </div>
              </ResumeSection>
            ) : null}

            <ResumeSection
              title={locale === 'en' ? 'Acknowledgement' : '致谢'}>
              <p className="text-sm leading-6 text-zinc-400">
                {locale === 'en'
                  ? 'Thank you for taking the time to review my resume. I look forward to discussing how my experience can contribute to your team.'
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
