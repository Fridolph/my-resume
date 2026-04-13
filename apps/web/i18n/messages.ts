import enAiTalk from './locales/en/aiTalk.json'
import enProfile from './locales/en/profile.json'
import enPublishedResume from './locales/en/publishedResume.json'
import enSite from './locales/en/site.json'
import zhAiTalk from './locales/zh/aiTalk.json'
import zhProfile from './locales/zh/profile.json'
import zhPublishedResume from './locales/zh/publishedResume.json'
import zhSite from './locales/zh/site.json'

import type { AppLocale } from './types'

const localeMessages = {
  en: {
    aiTalk: enAiTalk,
    profile: enProfile,
    publishedResume: enPublishedResume,
    site: enSite,
  },
  zh: {
    aiTalk: zhAiTalk,
    profile: zhProfile,
    publishedResume: zhPublishedResume,
    site: zhSite,
  },
} as const

export async function getI18nMessages(locale: AppLocale) {
  return localeMessages[locale]
}
