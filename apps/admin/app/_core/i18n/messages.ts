import enAi from '../../[locale]/dashboard/ai/_ai/i18n/en.json'
import zhAi from '../../[locale]/dashboard/ai/_ai/i18n/zh.json'
import enAuth from '../../[locale]/_auth/i18n/en.json'
import zhAuth from '../../[locale]/_auth/i18n/zh.json'
import enPublish from '../../[locale]/dashboard/publish/_publish/i18n/en.json'
import zhPublish from '../../[locale]/dashboard/publish/_publish/i18n/zh.json'
import enWorkspace from '../../[locale]/dashboard/_shared/i18n/en.json'
import zhWorkspace from '../../[locale]/dashboard/_shared/i18n/zh.json'

import type { AppLocale } from './types'

export async function getI18nMessages(locale: AppLocale) {
  return {
    ai: locale === 'zh' ? zhAi : enAi,
    auth: locale === 'zh' ? zhAuth : enAuth,
    publish: locale === 'zh' ? zhPublish : enPublish,
    workspace: locale === 'zh' ? zhWorkspace : enWorkspace,
  }
}
