import enSite from '../../_shared/site/i18n/en.json'
import zhSite from '../../_shared/site/i18n/zh.json'
import enPublishedResume from '../../_shared/published-resume/i18n/en.json'
import zhPublishedResume from '../../_shared/published-resume/i18n/zh.json'
import enProfile from '../../[locale]/profile/_profile/i18n/en.json'
import zhProfile from '../../[locale]/profile/_profile/i18n/zh.json'
import enAiTalk from '../../[locale]/ai-talk/_ai-talk/i18n/en.json'
import zhAiTalk from '../../[locale]/ai-talk/_ai-talk/i18n/zh.json'

import type { AppLocale } from './types'

export async function getI18nMessages(locale: AppLocale) {
  return {
    aiTalk: locale === 'zh' ? zhAiTalk : enAiTalk,
    profile: locale === 'zh' ? zhProfile : enProfile,
    publishedResume: locale === 'zh' ? zhPublishedResume : enPublishedResume,
    site: locale === 'zh' ? zhSite : enSite,
  }
}
