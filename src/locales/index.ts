import { createI18n } from 'vue-i18n'
import zh from './zh'
import en from './en'

const i18n = createI18n({
  locale: 'zh',
  legacy: false,
  globalInjection: true,
  fallbackLocale: 'zh',
  messages: {
    zh,
    en
  },
})

// console.log('i18n.allowComposition', i18n.allowComposition)

export default i18n
