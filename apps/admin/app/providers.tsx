'use client'

import { I18nProvider } from '@heroui/react'
import { ThemeProvider, useTheme } from 'next-themes'
import { useEffect, type ReactNode } from 'react'

import { AdminSessionProvider } from '@core/admin-session'
import { APP_VERSION, DEFAULT_API_BASE_URL } from '@core/env'
import { toHeroUiLocale, type AppLocale } from '@i18n/types'

declare global {
  interface Window {
    __MY_RESUME_BOOT_LOGGED__?: Record<string, boolean>
  }
}

function ThemeDatasetBridge() {
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    // HeroUI 和全局样式都依赖 data-theme，同步一份给根节点
    const nextTheme = resolvedTheme === 'dark' ? 'dark' : 'light'

    document.documentElement.dataset.theme = nextTheme
  }, [resolvedTheme])

  return null
}

/**
 * 后台全局 Provider 同时承接主题能力与会话上下文
 *
 * @param children 后台页面内容
 * @returns 后台全局 Provider 结构
 */
export function Providers({ children }: { children: ReactNode }) {
  return <ProvidersWithLocale locale="zh">{children}</ProvidersWithLocale>
}

export function ProvidersWithLocale({
  children,
  locale,
}: {
  children: ReactNode
  locale: AppLocale
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'test') {
      return
    }

    const scope = `admin:${locale}`
    const loggedScopes = (window.__MY_RESUME_BOOT_LOGGED__ ??= {})

    if (loggedScopes[scope]) {
      return
    }

    loggedScopes[scope] = true

    console.log('[my-resume:admin] boot', {
      apiBaseUrl: DEFAULT_API_BASE_URL,
      href: window.location.href,
      locale,
      version: APP_VERSION,
    })
  }, [locale])

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      disableTransitionOnChange
      enableSystem={false}
      storageKey="my-resume-theme-mode">
      <I18nProvider locale={toHeroUiLocale(locale)}>
        <AdminSessionProvider>
          <ThemeDatasetBridge />
          {children}
        </AdminSessionProvider>
      </I18nProvider>
    </ThemeProvider>
  )
}
