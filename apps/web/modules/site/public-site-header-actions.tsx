'use client'

import { buildPublishedResumeExportUrl } from '@my-resume/api-client'
import { Button } from '@heroui/react/button'
import { Dropdown } from '@heroui/react/dropdown'
import { Switch } from '@heroui/react/switch'
import { useThemeMode } from '@my-resume/ui/theme'
import { useTranslations } from 'next-intl'

import type { ResumeLocale } from '../published-resume/types/published-resume.types'
import styles from './site-header.module.css'

const PROJECT_GITHUB_URL = 'https://github.com/Fridolph/my-resume'

interface PublicSiteHeaderActionsProps {
  apiBaseUrl: string
  locale: ResumeLocale
}

export function PublicSiteHeaderActions({
  apiBaseUrl,
  locale,
}: PublicSiteHeaderActionsProps) {
  const t = useTranslations('site')
  const { theme, setTheme } = useThemeMode()
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
    <>
      <Dropdown.Root>
        <Dropdown.Trigger
          aria-label={t('downloadAriaLabel')}
          className={styles.headerActionTrigger}>
          <DownloadIcon className="h-4 w-4" />
        </Dropdown.Trigger>
        <Dropdown.Popover placement="bottom end">
          <Dropdown.Menu aria-label={t('downloadMenuLabel')}>
            <Dropdown.Item href={markdownExportUrl} id="download-markdown">
              {t('exportMarkdownMenu')}
            </Dropdown.Item>
            <Dropdown.Item href={pdfExportUrl} id="download-pdf">
              {t('exportPdfMenu')}
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown.Root>

      <Switch.Root
        aria-label={t('themeSwitchAriaLabel')}
        className={styles.themeSwitch}
        isSelected={theme === 'dark'}
        onChange={(isSelected) => setTheme(isSelected ? 'dark' : 'light')}>
        {({ isSelected }) => (
          <Switch.Control
            className={[
              styles.themeSwitchControl,
              isSelected ? styles.themeSwitchControlDark : styles.themeSwitchControlLight,
            ].join(' ')}>
            <Switch.Thumb
              className={[
                styles.themeSwitchThumb,
                isSelected ? styles.themeSwitchThumbDark : styles.themeSwitchThumbLight,
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
          aria-label={t('githubAriaLabel')}
          className={styles.githubButton}
          isIconOnly
          size="sm"
          variant="ghost">
          <GitHubIcon className="h-4 w-4" />
        </Button>
      </a>
    </>
  )
}

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
