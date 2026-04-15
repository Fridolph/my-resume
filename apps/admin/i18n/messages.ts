import enAi from './locales/en/ai.json'
import enAuth from './locales/en/auth.json'
import enPublish from './locales/en/publish.json'
import enWorkspace from './locales/en/workspace.json'
import zhAi from './locales/zh/ai.json'
import zhAuth from './locales/zh/auth.json'
import zhPublish from './locales/zh/publish.json'
import zhWorkspace from './locales/zh/workspace.json'

import type { AppLocale } from './types'

const localeMessages = {
  en: {
    ai: enAi,
    auth: enAuth,
    publish: enPublish,
    workspace: enWorkspace,
  },
  zh: {
    ai: zhAi,
    auth: zhAuth,
    publish: zhPublish,
    workspace: zhWorkspace,
  },
} as const

export async function getI18nMessages(locale: AppLocale) {
  return localeMessages[locale]
}
