'use client'

import { Button } from '@heroui/react/button'
import dynamic from 'next/dynamic'
import { Skeleton } from '@heroui/react/skeleton'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

import { DEFAULT_API_BASE_URL } from '@core/env'
import { Link, usePathname, useRouter } from '@i18n/navigation'
import { normalizeLocalePathname } from '@i18n/types'
import type {
  IdleWindowCallbacks,
  PublicSiteHeaderProps,
} from './site-header.types'
import styles from './site-header.module.css'

const DeferredPublicSiteHeaderActions = dynamic(
  () =>
    import('./public-site-header-actions').then(
      (module) => module.PublicSiteHeaderActions,
    ),
  {
    ssr: false,
    loading: () => <HeaderActionsFallback />,
  },
)

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
 * @returns 公开站头部节点
 */
export function PublicSiteHeader({
  apiBaseUrl = DEFAULT_API_BASE_URL,
  deferActionsUntilIdle = false,
  locale,
}: PublicSiteHeaderProps) {
  const isJsdom = typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent)
  const [shouldLoadActions, setShouldLoadActions] = useState(
    () => !deferActionsUntilIdle || isJsdom,
  )
  const t = useTranslations('site')
  const pathname = usePathname()
  const router = useRouter()
  const normalizedPathname = normalizeLocalePathname(pathname)

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

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/88 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/82">
      <div className="mx-auto flex min-h-16 w-full max-w-7xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2 sm:px-6 md:grid md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:gap-4">
        <div className="flex min-w-0 items-center gap-3 md:justify-self-start">
          <Link className="inline-flex min-w-0 items-center gap-3" href="/">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-extrabold tracking-[-0.08em] text-white dark:bg-white dark:text-slate-950">
              FY
            </span>
            <span
              className="hidden min-w-0 flex-col md:flex"
              data-testid="public-site-brand-text">
              <span className="truncate text-lg font-semibold text-slate-950 dark:text-white">
                {t('brandName')}
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
                  ? normalizedPathname === item.href
                  : normalizedPathname.startsWith(item.href)
              const label =
                item.key === 'resume'
                  ? t('resumeNav')
                  : item.key === 'profile'
                    ? t('profileNav')
                    : t('aiTalkNav')

              return (
                <Link
                  aria-current={isActive ? 'page' : undefined}
                  className={[
                    styles.primaryNavLink,
                    isActive ? styles.primaryNavLinkActive : '',
                  ]
                    .join(' ')
                    .trim()}
                  href={item.href}
                  key={item.href}>
                  {label}
                </Link>
              )
            })}
          </div>
        </div>

        <div className="ml-auto flex shrink-0 flex-nowrap items-center justify-end gap-2 md:justify-self-end">
          <div className={styles.localeSwitchWrapper}>
            <Button
              className={styles.localeSwitchButton}
              onPress={() => router.replace(normalizedPathname, { locale: 'zh' })}
              size="sm"
              type="button"
              variant={locale === 'zh' ? 'primary' : 'ghost'}>
              {t('langZh')}
            </Button>
            <Button
              className={styles.localeSwitchButton}
              onPress={() => router.replace(normalizedPathname, { locale: 'en' })}
              size="sm"
              type="button"
              variant={locale === 'en' ? 'primary' : 'ghost'}>
              {t('langEn')}
            </Button>
          </div>

          {shouldLoadActions ? (
            <DeferredPublicSiteHeaderActions apiBaseUrl={apiBaseUrl} locale={locale} />
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
      <Skeleton
        className="h-[30px] w-[30px] rounded-full border border-slate-200/80 bg-white/60 dark:border-white/10 dark:bg-white/5"
        data-testid="public-site-header-action-skeleton"
      />
      <Skeleton
        className="h-[30px] w-12 rounded-full border border-slate-200/80 bg-white/72 dark:border-white/10 dark:bg-white/5"
        data-testid="public-site-theme-switch-skeleton"
      />
      <Skeleton
        className="h-[30px] w-[30px] rounded-full border border-slate-200/80 bg-white/60 dark:border-white/10 dark:bg-white/5"
        data-testid="public-site-header-action-skeleton"
      />
    </div>
  )
}
