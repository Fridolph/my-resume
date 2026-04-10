import enSite from '../modules/site/i18n/en.json'
import zhSite from '../modules/site/i18n/zh.json'

import type { AppLocale } from './types'

export async function getI18nMessages(locale: AppLocale) {
  return {
    site: locale === 'zh' ? zhSite : enSite,
  }
}
