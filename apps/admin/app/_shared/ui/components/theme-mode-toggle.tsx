'use client'

import { Button } from '@heroui/react/button'
import { useTheme } from 'next-themes'

import styles from './theme-mode-toggle.module.css'

function SunIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="currentColor"
      height="12"
      viewBox="0 0 24 24"
      width="12">
      <path d="M12 4.25a.75.75 0 0 1 .75.75v1.36a.75.75 0 0 1-1.5 0V5a.75.75 0 0 1 .75-.75Zm0 13.38a.75.75 0 0 1 .75.75v1.37a.75.75 0 0 1-1.5 0v-1.37a.75.75 0 0 1 .75-.75Zm7-6.38a.75.75 0 0 1 0 1.5h-1.37a.75.75 0 0 1 0-1.5H19Zm-12.63 0a.75.75 0 0 1 0 1.5H5a.75.75 0 0 1 0-1.5h1.37Zm9.23-4.6a.75.75 0 0 1 1.06 0l.96.97a.75.75 0 1 1-1.06 1.06l-.96-.97a.75.75 0 0 1 0-1.06Zm-8.19 8.2a.75.75 0 0 1 1.06 0l.97.96a.75.75 0 1 1-1.06 1.06l-.97-.96a.75.75 0 0 1 0-1.06Zm9.16 1.03a.75.75 0 0 1 1.06 1.06l-.96.96a.75.75 0 1 1-1.06-1.06l.96-.96Zm-8.19-8.2a.75.75 0 0 1 1.06 1.06l-.97.97A.75.75 0 1 1 7.4 8.7l.97-.97ZM12 7.75a4.25 4.25 0 1 1 0 8.5 4.25 4.25 0 0 1 0-8.5Z" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="currentColor"
      height="12"
      viewBox="0 0 24 24"
      width="12">
      <path d="M13.2 2.82c.25.08.4.34.37.6a7.78 7.78 0 0 0 7.01 8.69c.26.03.5.22.56.48a.7.7 0 0 1-.21.7 9.7 9.7 0 1 1-8.45-10.53.7.7 0 0 1 .72.06Z" />
    </svg>
  )
}

export function ThemeModeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const switchA11yProps = {
    role: 'switch',
    'aria-checked': isDark,
  } as const

  return (
    <Button
      {...(switchA11yProps as Record<string, unknown>)}
      aria-label="切换明暗主题"
      className={styles.switchRoot}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      type="button"
      variant="ghost">
      <span
        className={[
          styles.switchControl,
          isDark ? styles.switchControlDark : styles.switchControlLight,
        ].join(' ')}>
        <span
          className={[styles.switchThumb, isDark ? styles.switchThumbDark : styles.switchThumbLight]
            .join(' ')
            .trim()}>
          <span className={styles.switchIcon}>{isDark ? <MoonIcon /> : <SunIcon />}</span>
        </span>
      </span>
    </Button>
  )
}
