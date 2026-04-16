'use client'

import { buildPublishedResumeExportUrl } from '@my-resume/api-client'
import { Dropdown } from '@heroui/react/dropdown'
import { Header } from '@heroui/react/header'
import { Separator } from '@heroui/react/separator'
import { useThemeMode } from '@my-resume/ui/theme'
import { useTranslations } from 'next-intl'
import type { Key } from 'react'

import { usePathname, useRouter } from '@i18n/navigation'
import { normalizeLocalePathname } from '@i18n/types'
import type { ResumeLocale } from '../published-resume/types/published-resume.types'
import styles from './site-header.module.css'

const PROJECT_GITHUB_URL = 'https://github.com/Fridolph/my-resume'

interface PublicSiteHeaderMobileMenuProps {
  apiBaseUrl: string
  locale: ResumeLocale
}

export function PublicSiteHeaderMobileMenu({
  apiBaseUrl,
  locale,
}: PublicSiteHeaderMobileMenuProps) {
  const t = useTranslations('site')
  const { theme, setTheme } = useThemeMode()
  const pathname = usePathname()
  const router = useRouter()
  const normalizedPathname = normalizeLocalePathname(pathname)
  const markdownExportUrl = buildPublishedResumeExportUrl({
    apiBaseUrl,
    format: 'markdown',
    locale,
  })
  const pdfExportUrl = buildPublishedResumeExportUrl({
    apiBaseUrl,
    format: 'pdf',
    locale,
  })
  const nextLocale: ResumeLocale = locale === 'zh' ? 'en' : 'zh'
  const languageToggleLabel =
    nextLocale === 'zh' ? t('mobileMenuLangToggleToZh') : t('mobileMenuLangToggleToEn')
  const themeToggleLabel =
    theme === 'dark' ? t('mobileMenuThemeToggleToLight') : t('mobileMenuThemeToggleToDark')

  const handleMenuAction = (key: Key) => {
    const action = String(key)

    if (action === 'nav-resume' || action === 'nav-profile' || action === 'nav-ai-talk') {
      const nextHref = action === 'nav-resume' ? '/' : action === 'nav-profile' ? '/profile' : '/ai-talk'
      const routerWithPush = router as typeof router & { push?: (href: string) => void }

      if (typeof routerWithPush.push === 'function') {
        routerWithPush.push(nextHref)
      } else {
        router.replace(nextHref)
      }

      return
    }

    if (action === 'lang-toggle') {
      router.replace(normalizedPathname, { locale: nextLocale })
      return
    }

    if (action === 'theme-toggle') {
      setTheme(theme === 'dark' ? 'light' : 'dark')
    }
  }

  return (
    <Dropdown.Root>
      <Dropdown.Trigger
        aria-label={t('mobileMenuAriaLabel')}
        className={styles.headerActionTrigger}
        data-testid="public-site-mobile-menu-trigger">
        <MenuIcon className="h-4 w-4" />
      </Dropdown.Trigger>
      <Dropdown.Popover placement="bottom end">
        <Dropdown.Menu aria-label={t('mobileMenuLabel')} onAction={handleMenuAction}>
          <Dropdown.Section aria-label={t('mobileMenuSections.navigation')}>
            <Header className="px-2.5 pt-1 pb-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
              {t('mobileMenuSections.navigation')}
            </Header>
            <Dropdown.Item id="nav-resume">{t('resumeNav')}</Dropdown.Item>
            <Dropdown.Item id="nav-profile">{t('profileNav')}</Dropdown.Item>
            <Dropdown.Item id="nav-ai-talk">{t('aiTalkNav')}</Dropdown.Item>
          </Dropdown.Section>
          <Separator className="my-1" />
          <Dropdown.Section aria-label={t('mobileMenuSections.toggles')}>
            <Header className="px-2.5 pt-1 pb-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
              {t('mobileMenuSections.toggles')}
            </Header>
            <Dropdown.Item id="lang-toggle">{languageToggleLabel}</Dropdown.Item>
            <Dropdown.Item id="theme-toggle">{themeToggleLabel}</Dropdown.Item>
          </Dropdown.Section>
          <Separator className="my-1" />
          <Dropdown.Section aria-label={t('mobileMenuSections.download')}>
            <Header className="px-2.5 pt-1 pb-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
              {t('mobileMenuSections.download')}
            </Header>
            <Dropdown.Item href={markdownExportUrl} id="download-markdown">
              {t('exportMarkdownMenu')}
            </Dropdown.Item>
            <Dropdown.Item href={pdfExportUrl} id="download-pdf">
              {t('exportPdfMenu')}
            </Dropdown.Item>
          </Dropdown.Section>
          <Separator className="my-1" />
          <Dropdown.Section aria-label={t('mobileMenuSections.social')}>
            <Header className="px-2.5 pt-1 pb-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
              {t('mobileMenuSections.social')}
            </Header>
            <Dropdown.Item
              href={PROJECT_GITHUB_URL}
              id="github-link"
              rel="noreferrer"
              target="_blank">
              <span className="inline-flex items-center gap-2">
                <GitHubIcon className="h-4 w-4" />
                <span>{t('githubMenuLabel')}</span>
              </span>
            </Dropdown.Item>
          </Dropdown.Section>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown.Root>
  )
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height="16"
      viewBox="0 0 24 24"
      width="16">
      <path
        d="M4 7H20M4 12H20M4 17H20"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 .5C5.65.5.5 5.65.5 12.15c0 5.2 3.37 9.6 8.05 11.16.59.11.8-.26.8-.57 0-.28-.01-1.03-.02-2.03-3.27.73-3.96-1.61-3.96-1.61-.54-1.4-1.32-1.78-1.32-1.78-1.08-.76.08-.74.08-.74 1.19.09 1.82 1.25 1.82 1.25 1.06 1.85 2.77 1.31 3.45 1 .11-.79.41-1.31.74-1.61-2.61-.31-5.35-1.34-5.35-5.95 0-1.31.46-2.38 1.22-3.22-.12-.31-.53-1.58.12-3.3 0 0 .99-.33 3.25 1.23a11.03 11.03 0 0 1 5.92 0c2.26-1.56 3.24-1.23 3.24-1.23.66 1.72.25 2.99.13 3.3.76.84 1.22 1.91 1.22 3.22 0 4.62-2.75 5.63-5.37 5.94.43.38.81 1.11.81 2.23 0 1.61-.01 2.91-.01 3.31 0 .31.21.69.81.57 4.67-1.57 8.03-5.97 8.03-11.16C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  )
}
