import { describe, expect, it } from 'vitest'

import { createExampleStandardResume } from '../domain/standard-resume'
import {
  buildResumeSummary,
  readResumeLocaleFromCookie,
  resolveResumeSummaryLocale,
} from '../resume-summary'

describe('resume summary helpers', () => {
  it('should build projected summary with a single locale payload', () => {
    const resume = createExampleStandardResume()
    resume.profile.headline = {
      zh: '中文标题',
      en: 'English Headline',
    }
    resume.profile.summary = {
      zh: '中文摘要',
      en: 'English Summary',
    }

    expect(buildResumeSummary(resume, 'zh')).toEqual({
      meta: {
        slug: 'standard-resume',
        defaultLocale: 'zh',
        locale: 'zh',
      },
      profile: {
        headline: '中文标题',
        summary: '中文摘要',
      },
      counts: {
        education: resume.education.length,
        experiences: resume.experiences.length,
        projects: resume.projects.length,
        skills: resume.skills.length,
        highlights: resume.highlights.length,
      },
    })
  })

  it('should resolve locale from query first then cookie then fallback', () => {
    expect(
      resolveResumeSummaryLocale({
        localeQuery: 'en',
        cookieHeader: 'my-resume-locale=zh',
        fallbackLocale: 'zh',
      }),
    ).toEqual({
      locale: 'en',
      queryInvalid: false,
    })

    expect(
      resolveResumeSummaryLocale({
        cookieHeader: 'theme=dark; my-resume-locale=en',
        fallbackLocale: 'zh',
      }),
    ).toEqual({
      locale: 'en',
      queryInvalid: false,
    })

    expect(
      resolveResumeSummaryLocale({
        cookieHeader: 'theme=dark',
        fallbackLocale: 'zh',
      }),
    ).toEqual({
      locale: 'zh',
      queryInvalid: false,
    })
  })

  it('should ignore invalid cookie locale and flag invalid query locale', () => {
    expect(readResumeLocaleFromCookie('my-resume-locale=ja')).toBeNull()

    expect(
      resolveResumeSummaryLocale({
        localeQuery: 'ja',
        cookieHeader: 'my-resume-locale=en',
        fallbackLocale: 'zh',
      }),
    ).toEqual({
      locale: 'zh',
      queryInvalid: true,
    })
  })
})
