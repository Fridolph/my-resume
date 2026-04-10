import enAi from '../modules/ai/i18n/en.json'
import zhAi from '../modules/ai/i18n/zh.json'
import enAuth from '../modules/auth/i18n/en.json'
import zhAuth from '../modules/auth/i18n/zh.json'
import enPublish from '../modules/publish/i18n/en.json'
import zhPublish from '../modules/publish/i18n/zh.json'
import enWorkspace from '../modules/workspace/i18n/en.json'
import zhWorkspace from '../modules/workspace/i18n/zh.json'

import type { AppLocale } from './types'

export async function getI18nMessages(locale: AppLocale) {
  return {
    ai: locale === 'zh' ? zhAi : enAi,
    auth: locale === 'zh' ? zhAuth : enAuth,
    publish: locale === 'zh' ? zhPublish : enPublish,
    workspace: locale === 'zh' ? zhWorkspace : enWorkspace,
  }
}
