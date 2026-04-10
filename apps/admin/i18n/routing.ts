import { defineRouting } from 'next-intl/routing'

import { appLocales } from './types'

export const routing = defineRouting({
  locales: [...appLocales],
  defaultLocale: 'zh',
  localePrefix: 'always',
})
