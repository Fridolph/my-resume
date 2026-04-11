import './globals.css'

import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import type { ReactNode } from 'react'

import { isAppLocale, toHtmlLang, type AppLocale } from '@core/i18n/types'
import { ProvidersWithLocale } from './providers'

export const metadata: Metadata = {
  title: 'my-resume admin',
  description: 'Personal resume admin shell',
}

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
    <html lang={htmlLang} suppressHydrationWarning>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ProvidersWithLocale locale={locale}>{children}</ProvidersWithLocale>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
