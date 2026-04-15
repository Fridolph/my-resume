import './globals.css'

import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import type { ReactNode } from 'react'

import { getI18nMessages } from '@i18n/messages'
import { toHtmlLang, type AppLocale } from '@i18n/types'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'my-resume admin',
  description: 'Personal resume admin shell',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return <RootLayoutInner>{children}</RootLayoutInner>
}

async function RootLayoutInner({ children }: { children: ReactNode }) {
  const locale: AppLocale = 'zh'
  const htmlLang = toHtmlLang(locale)
  const messages = await getI18nMessages(locale)

  return (
    <html lang={htmlLang} suppressHydrationWarning>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
