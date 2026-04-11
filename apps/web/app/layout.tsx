import './globals.css'

import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'

import { isAppLocale, toHeroUiLocale, toHtmlLang, type AppLocale } from '@core/i18n/types'
import { WebLocaleProviders } from './web-locale-providers'

export const metadata: Metadata = {
  title: 'my-resume web',
  description: 'Public resume web shell',
}

// 在 hydration 前同步主题，避免 light / dark 首屏闪烁
const themeInitScript = `
  (function () {
    try {
      var storageKey = 'my-resume-theme-mode';
      var storedTheme = window.localStorage.getItem(storageKey);
      var theme = storedTheme === 'dark' ? 'dark' : 'light';
      var root = document.documentElement;
      root.dataset.theme = theme;
      root.style.colorScheme = theme;
      if (theme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    } catch (error) {}
  })();
`

/**
 * 公开站根布局只承接全局样式和主题上下文，不放业务读取逻辑
 *
 * @param children 页面内容
 * @returns 公开站根布局节点
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return <RootLayoutInner>{children}</RootLayoutInner>
}

async function RootLayoutInner({ children }: { children: ReactNode }) {
  const resolvedLocale = await getLocale()
  const locale: AppLocale = isAppLocale(resolvedLocale) ? resolvedLocale : 'zh'
  const htmlLang = toHtmlLang(locale)
  const messages = await getMessages()

  return (
    <html
      data-template="default"
      data-theme="light"
      lang={htmlLang}
      suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <WebLocaleProviders heroLocale={toHeroUiLocale(locale)} locale={locale}>
            {children}
          </WebLocaleProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
