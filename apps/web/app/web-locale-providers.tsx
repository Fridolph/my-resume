'use client'

import { I18nProvider } from '@heroui/react/rac'
import { ThemeModeProvider } from '@my-resume/ui/theme'
import { useEffect, type ReactNode } from 'react'

import { APP_VERSION, DEFAULT_PUBLIC_API_BASE_URL } from '@core/env'
import type { AppLocale } from '@i18n/types'

declare global {
  interface Window {
    __MY_RESUME_BOOT_LOGGED__?: Record<string, boolean>
  }
}

const startupBanner = String.raw`
   __      _     _       _       _     
  / _|    (_)   | |     | |     | |    
 | |_ _ __ _  __| | ___ | |_ __ | |__  
 |  _| '__| |/ _\` |/ _ \\| | '_ \\| '_ \\ 
 | | | |  | | (_| | (_) | | |_) | | | |
 |_| |_|  |_|\__,_|\___/|_| .__/|_| |_|
                          | |          
                          |_|          `

export function WebLocaleProviders({
  children,
  heroLocale,
  locale,
}: {
  children: ReactNode
  heroLocale: 'zh-CN' | 'en-US'
  locale: AppLocale
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'test') {
      return
    }

    const scope = `web:${locale}`
    const loggedScopes = (window.__MY_RESUME_BOOT_LOGGED__ ??= {})

    if (loggedScopes[scope]) {
      return
    }

    loggedScopes[scope] = true

    console.log(startupBanner)
    console.log('[my-resume:web] boot', {
      apiBaseUrl: DEFAULT_PUBLIC_API_BASE_URL,
      href: window.location.href,
      locale,
      version: APP_VERSION,
    })
  }, [locale])

  return (
    <I18nProvider locale={heroLocale}>
      <ThemeModeProvider>{children}</ThemeModeProvider>
    </I18nProvider>
  )
}
