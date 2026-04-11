'use client'

import { I18nProvider } from '@heroui/react'
import { ThemeModeProvider } from '@my-resume/ui/theme'
import type { ReactNode } from 'react'

import type { AppLocale } from '@core/i18n/types'

export function WebLocaleProviders({
  children,
  heroLocale,
  locale: _locale,
}: {
  children: ReactNode
  heroLocale: 'zh-CN' | 'en-US'
  locale: AppLocale
}) {
  return (
    <I18nProvider locale={heroLocale}>
      <ThemeModeProvider>{children}</ThemeModeProvider>
    </I18nProvider>
  )
}
