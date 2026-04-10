import enMessages from '../i18n/en.json'
import zhMessages from '../i18n/zh.json'
import type { AppLocale } from '../../../i18n/types'
import type { AdminNavigationItem } from '../types/admin-navigation.types'

const navigationMessages = {
  en: enMessages,
  zh: zhMessages,
} as const

export function getAdminNavigationItems(locale: AppLocale): AdminNavigationItem[] {
  const messages = navigationMessages[locale]

  return [
  {
    key: 'overview',
    href: '/dashboard',
    title: messages.overviewTitle,
    description: messages.overviewDescription,
    shortLabel: messages.overviewShortLabel,
    eyebrow: messages.overviewEyebrow,
  },
  {
    key: 'resume',
    href: '/dashboard/resume',
    title: messages.resumeTitle,
    description: messages.resumeDescription,
    shortLabel: messages.resumeShortLabel,
    eyebrow: messages.resumeEyebrow,
  },
  {
    key: 'ai',
    href: '/dashboard/ai',
    title: messages.aiTitle,
    description: messages.aiDescription,
    shortLabel: messages.aiShortLabel,
    eyebrow: messages.aiEyebrow,
  },
  {
    key: 'publish',
    href: '/dashboard/publish',
    title: messages.publishTitle,
    description: messages.publishDescription,
    shortLabel: messages.publishShortLabel,
    eyebrow: messages.publishEyebrow,
  },
]
}

export function getAdminPageMeta(pathname: string, locale: AppLocale): AdminNavigationItem {
  const items = getAdminNavigationItems(locale)
  const exactMatch = items.find((item) => item.href === pathname)

  if (exactMatch) {
    return exactMatch
  }

  const nestedMatch = items.find(
    (item) => item.href !== '/dashboard' && pathname.startsWith(item.href),
  )

  return nestedMatch ?? items[0]
}
