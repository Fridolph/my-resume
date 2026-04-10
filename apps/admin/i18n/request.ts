import { hasLocale } from 'next-intl'
import { getRequestConfig } from 'next-intl/server'

import { getI18nMessages } from './messages'
import { routing } from './routing'
import type { AppLocale } from './types'

export default getRequestConfig(async ({ requestLocale }) => {
  const requestedLocale = await requestLocale
  const locale = hasLocale(routing.locales, requestedLocale)
    ? requestedLocale
    : routing.defaultLocale

  return {
    locale,
    messages: await getI18nMessages(locale as AppLocale),
  }
})
