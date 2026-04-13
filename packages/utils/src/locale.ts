export const appLocales = ['zh', 'en'] as const

export type AppLocale = (typeof appLocales)[number]

export function isAppLocale(value: string): value is AppLocale {
  return value === 'zh' || value === 'en'
}

export function toHtmlLang(locale: AppLocale): 'zh-CN' | 'en-US' {
  return locale === 'zh' ? 'zh-CN' : 'en-US'
}

export function toHeroUiLocale(locale: AppLocale): 'zh-CN' | 'en-US' {
  return toHtmlLang(locale)
}

export function normalizeLocalePathname(pathname: string | null | undefined): string {
  if (!pathname || pathname === '/') {
    return '/'
  }

  const normalizedPathname = pathname.startsWith('/') ? pathname : `/${pathname}`
  const segments = normalizedPathname.split('/').filter(Boolean)

  if (segments.length === 0) {
    return '/'
  }

  const [firstSegment, ...restSegments] = segments

  if (!isAppLocale(firstSegment)) {
    return normalizedPathname
  }

  return restSegments.length === 0 ? '/' : `/${restSegments.join('/')}`
}
