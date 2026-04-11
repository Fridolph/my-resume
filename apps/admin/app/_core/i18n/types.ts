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
