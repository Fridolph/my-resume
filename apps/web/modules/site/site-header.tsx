'use client'

import { Button } from '@heroui/react/button'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, type ComponentType } from 'react'

import { DEFAULT_API_BASE_URL } from '../../core/env'
import type { ResumeLocale } from '../published-resume/types/published-resume.types'
import { resumeLabels } from '../published-resume/published-resume-utils'
import styles from './site-header.module.css'

interface PublicSiteHeaderProps {
  apiBaseUrl?: string
  deferActionsUntilIdle?: boolean
  locale: ResumeLocale
  onChangeLocale: (locale: ResumeLocale) => void
}

interface PublicSiteHeaderActionsProps {
  apiBaseUrl: string
  locale: ResumeLocale
}

interface IdleWindowCallbacks {
  cancelIdleCallback?: (handle: number) => void
  requestIdleCallback?: (callback: () => void) => number
}

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

/**
 * 公开站头部统一处理导航、语言切换与头部动作入口
 *
 * @param apiBaseUrl 当前公开站访问的 API 基地址
 * @param locale 当前展示语言
 * @param onChangeLocale 切换展示语言的方法
 * @returns 公开站头部节点
 */
export function PublicSiteHeader({
  apiBaseUrl = DEFAULT_API_BASE_URL,
  deferActionsUntilIdle = false,
  locale,
  onChangeLocale,
}: PublicSiteHeaderProps) {
  const isJsdom = typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent)
  const [shouldLoadActions, setShouldLoadActions] = useState(
    () => !deferActionsUntilIdle || isJsdom,
  )
  const [actionsComponent, setActionsComponent] = useState<ComponentType<
    PublicSiteHeaderActionsProps
  > | null>(null)
  const pathname = usePathname()
  const labels = resumeLabels[locale]

  useEffect(() => {
    if (!deferActionsUntilIdle || shouldLoadActions || isJsdom || typeof window === 'undefined') {
      return
    }

    const idleWindow = window as Window & IdleWindowCallbacks
    let timeoutId: number | null = null
    let idleId: number | null = null

    const markReady = () => {
      setShouldLoadActions(true)
    }

    if (typeof idleWindow.requestIdleCallback === 'function') {
      idleId = idleWindow.requestIdleCallback(markReady)
    } else {
      timeoutId = window.setTimeout(markReady, 0)
    }

    return () => {
      if (idleId !== null && typeof idleWindow.cancelIdleCallback === 'function') {
        idleWindow.cancelIdleCallback(idleId)
      }

      if (timeoutId !== null) {
        window.clearTimeout(timeoutId)
      }
    }
  }, [deferActionsUntilIdle, isJsdom, shouldLoadActions])

  useEffect(() => {
    if (!shouldLoadActions || actionsComponent) {
      return
    }

    let active = true

    void import('./public-site-header-actions').then((module) => {
      if (!active) {
        return
      }

      setActionsComponent(() => module.PublicSiteHeaderActions)
    })

    return () => {
      active = false
    }
  }, [actionsComponent, shouldLoadActions])

  const HeaderActionsComponent = actionsComponent

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

          {HeaderActionsComponent ? (
            <HeaderActionsComponent apiBaseUrl={apiBaseUrl} locale={locale} />
          ) : (
            <HeaderActionsFallback />
          )}
        </div>
      </div>
    </header>
  )
}

const primaryNavWrapperClass = [
  'inline-flex flex-nowrap items-center gap-1.5 whitespace-nowrap',
  styles.primaryNavWrapper,
].join(' ')

function HeaderActionsFallback() {
  return (
    <div
      aria-hidden="true"
      className="flex items-center gap-2"
      data-testid="public-site-header-actions-fallback">
      <span className={styles.headerActionSkeleton} />
      <span className={styles.themeSwitchSkeleton} />
      <span className={styles.headerActionSkeleton} />
    </div>
  )
}
