import { getRequestConfig } from 'next-intl/server'

import { getI18nMessages } from './messages'
import type { AppLocale } from './types'

export default getRequestConfig(async () => {
  const locale: AppLocale = 'zh'

  return {
    locale,
    messages: await getI18nMessages(locale),
  }
})
