'use client'

import { buildPublishedResumeExportUrl } from '@my-resume/api-client'
import { Button } from '@heroui/react/button'
import { Dropdown } from '@heroui/react/dropdown'
import { Switch } from '@heroui/react/switch'
import { useThemeMode } from '@my-resume/ui/theme'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { DEFAULT_API_BASE_URL } from '../../core/env'
import type { ResumeLocale } from '../published-resume/types/published-resume.types'
import { resumeLabels } from '../published-resume/published-resume-utils'
import styles from './header.module.css'

interface PublicSiteHeaderProps {
  apiBaseUrl?: string
  locale: ResumeLocale
  onChangeLocale: (locale: ResumeLocale) => void
}

const PROJECT_GITHUB_URL = 'https://github.com/Fridolph/my-resume'
const navItems = [
  {
    href: '/',
    key: 'resume',
  },
  {
    href: '/profile',
    key: 'profile',
  },
  {
    href: '/ai-talk',
    key: 'aiTalk',
  },
] as const

export function PublicSiteHeader({
  apiBaseUrl = DEFAULT_API_BASE_URL,
  locale,
  onChangeLocale,
}: PublicSiteHeaderProps) {
  const pathname = usePathname()
  const { theme, setTheme } = useThemeMode()
  const labels = resumeLabels[locale]
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

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/88 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/82">
      <div className="mx-auto flex min-h-16 w-full max-w-7xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2 sm:px-6 md:grid md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:gap-4">
        <div className="flex min-w-0 items-center gap-3 md:justify-self-start">
          <Link className="inline-flex min-w-0 items-center gap-3" href="/" prefetch={false}>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-extrabold tracking-[-0.08em] text-white dark:bg-white dark:text-slate-950">
              FY
            </span>
            <span
              className="hidden min-w-0 flex-col md:flex"
              data-testid="public-site-brand-text">
              <span className="truncate text-lg font-semibold text-slate-950 dark:text-white">
                Fridolph Resume
              </span>
            </span>
          </Link>
        </div>

        <div className="order-3 flex w-full justify-start overflow-x-auto pb-1 sm:justify-center md:order-none md:w-auto md:justify-self-center md:overflow-visible md:pb-0">
          <div
            aria-label="Public site navigation"
            className={primaryNavWrapperClass}
            data-testid="public-site-nav">
            {navItems.map((item) => {
              const isActive =
                item.href === '/'
                  ? pathname === item.href
                  : pathname.startsWith(item.href)
              const label =
                item.key === 'resume'
                  ? labels.resumeNav
                  : item.key === 'profile'
                    ? labels.profileNav
                    : labels.aiTalkNav

              return (
                <Link href={item.href} key={item.href} prefetch={false}>
                  <Button
                    className={styles.primaryNavButton}
                    size="sm"
                    variant={isActive ? 'primary' : 'ghost'}>
                    {label}
                  </Button>
                </Link>
              )
            })}
          </div>
        </div>

        <div className="ml-auto flex shrink-0 flex-nowrap items-center justify-end gap-2 md:justify-self-end">
          <Dropdown.Root>
            <Dropdown.Trigger
              aria-label={labels.downloadAriaLabel}
              className={styles.headerActionTrigger}>
              <DownloadIcon className="h-4 w-4" />
            </Dropdown.Trigger>
            <Dropdown.Popover placement="bottom end">
              <Dropdown.Menu aria-label={labels.downloadMenuLabel}>
                <Dropdown.Item href={markdownExportUrl} id="download-markdown">
                  {labels.exportMarkdownMenu}
                </Dropdown.Item>
                <Dropdown.Item href={pdfExportUrl} id="download-pdf">
                  {labels.exportPdfMenu}
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown.Root>

          <div className={styles.localeSwitchWrapper}>
            <Button
              className={styles.localeSwitchButton}
              onClick={() => onChangeLocale('zh')}
              size="sm"
              type="button"
              variant={locale === 'zh' ? 'primary' : 'ghost'}>
              中
            </Button>
            <Button
              className={styles.localeSwitchButton}
              onClick={() => onChangeLocale('en')}
              size="sm"
              type="button"
              variant={locale === 'en' ? 'primary' : 'ghost'}>
              EN
            </Button>
          </div>

          <Switch.Root
            aria-label="切换明暗主题"
            className={styles.themeSwitch}
            isSelected={theme === 'dark'}
            onChange={(isSelected) => setTheme(isSelected ? 'dark' : 'light')}>
            {({ isSelected }) => (
              <Switch.Control
                className={[
                  styles.themeSwitchControl,
                  isSelected
                    ? styles.themeSwitchControlDark
                    : styles.themeSwitchControlLight,
                ].join(' ')}>
                <Switch.Thumb
                  className={[
                    styles.themeSwitchThumb,
                    isSelected
                      ? styles.themeSwitchThumbDark
                      : styles.themeSwitchThumbLight,
                  ].join(' ')}
                  style={{ marginInlineStart: isSelected ? '18px' : '0px' }}>
                  <Switch.Icon className={styles.themeSwitchIcon}>
                    {isSelected ? <ThemeMoonIcon /> : <ThemeSunIcon />}
                  </Switch.Icon>
                </Switch.Thumb>
              </Switch.Control>
            )}
          </Switch.Root>

          <a href={PROJECT_GITHUB_URL} rel="noreferrer" target="_blank">
            <Button
              aria-label={labels.githubAriaLabel}
              className={styles.githubButton}
              isIconOnly
              size="sm"
              variant="ghost">
              <GitHubIcon className="h-4 w-4" />
            </Button>
          </a>
        </div>
      </div>
    </header>
  )
}

const primaryNavWrapperClass = [
  'inline-flex flex-nowrap items-center gap-1.5 whitespace-nowrap',
  styles.primaryNavWrapper,
].join(' ')

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height="16"
      viewBox="0 0 24 24"
      width="16">
      <path
        d="M12 3V14M12 14L8 10M12 14L16 10M5 18H19"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function ThemeSunIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height="12"
      viewBox="0 0 24 24"
      width="12">
      <path
        d="M12 3V5M12 19V21M4.93 4.93L6.34 6.34M17.66 17.66L19.07 19.07M3 12H5M19 12H21M4.93 19.07L6.34 17.66M17.66 6.34L19.07 4.93M16 12A4 4 0 1 1 8 12A4 4 0 0 1 16 12Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function ThemeMoonIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height="12"
      viewBox="0 0 24 24"
      width="12">
      <path
        d="M20 15.39A8 8 0 1 1 8.61 4A6.5 6.5 0 0 0 20 15.39Z"
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
