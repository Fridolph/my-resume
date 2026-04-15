import { NextIntlClientProvider } from 'next-intl'
import { hasLocale } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'

import { type AppLocale, toHeroUiLocale } from '@i18n/types'
import { routing } from '@i18n/routing'
import { WebLocaleProviders } from '../web-locale-providers'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: ReactNode
  params: Promise<{ locale: string }>
}>) {
  const { locale } = await params

  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  const routeLocale = locale as AppLocale

  setRequestLocale(routeLocale)
  const messages = await getMessages()

  return (
    <NextIntlClientProvider locale={routeLocale} messages={messages}>
      <WebLocaleProviders heroLocale={toHeroUiLocale(routeLocale)} locale={routeLocale}>
        {children}
      </WebLocaleProviders>
    </NextIntlClientProvider>
  )
}
