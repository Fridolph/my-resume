import { appLocales } from '@my-resume/utils'

export const i18nConfig = {
  defaultLocale: 'zh',
  localePrefix: 'never' as const,
  locales: [...appLocales],
  localePath: './locales',
  sourceLocale: 'en' as const,
} as const

export default i18nConfig
