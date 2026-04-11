import type { ResumeLocale } from '../types/resume.types'

const RESUME_LOCALE_COOKIE_KEY = 'my-resume-locale'

export function parseResumeLocale(value: string | undefined): ResumeLocale | undefined {
  if (value === 'zh' || value === 'en') {
    return value
  }

  return undefined
}

export function readResumeLocaleCookie(): ResumeLocale | undefined {
  if (typeof document === 'undefined') {
    return undefined
  }

  const cookieEntries = document.cookie.split(';')

  for (const cookieEntry of cookieEntries) {
    const [rawKey, ...rawValueParts] = cookieEntry.trim().split('=')

    if (rawKey !== RESUME_LOCALE_COOKIE_KEY) {
      continue
    }

    const cookieValue = rawValueParts.join('=')

    try {
      return parseResumeLocale(decodeURIComponent(cookieValue))
    } catch {
      return parseResumeLocale(cookieValue)
    }
  }

  return undefined
}
