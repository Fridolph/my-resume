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

const DeferredPublicSiteHeaderMobileMenu = dynamic(
  () =>
    import('./public-site-header-mobile-menu').then(
      (module) => module.PublicSiteHeaderMobileMenu,
    ),
  {
    ssr: false,
    loading: () => null,
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
  const [shouldLoadMobileMenu, setShouldLoadMobileMenu] = useState(
    () => !deferActionsUntilIdle || isJsdom,
  )
  const [shouldLoadDesktopActions, setShouldLoadDesktopActions] = useState(
    () => !deferActionsUntilIdle || isJsdom,
  )
  const t = useTranslations('site')
  const pathname = usePathname()
  const router = useRouter()
  const normalizedPathname = normalizeLocalePathname(pathname)

  useEffect(() => {
    if (
      !deferActionsUntilIdle ||
      shouldLoadDesktopActions ||
      isJsdom ||
      typeof window === 'undefined'
    ) {
      return
    }

    const idleWindow = window as Window & IdleWindowCallbacks
    let timeoutId: number | null = null
    let idleId: number | null = null

    const markReady = () => {
      setShouldLoadDesktopActions(true)
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
  }, [deferActionsUntilIdle, isJsdom, shouldLoadDesktopActions])

  useEffect(() => {
    if (
      !deferActionsUntilIdle ||
      shouldLoadMobileMenu ||
      isJsdom ||
      typeof window === 'undefined'
    ) {
      return
    }

    const mobileMediaQuery = window.matchMedia('(max-width: 639px)')
    const markReady = () => {
      if (!mobileMediaQuery.matches) {
        return
      }

      setShouldLoadMobileMenu(true)
    }

    markReady()

    if (shouldLoadMobileMenu) {
      return
    }

    if (typeof mobileMediaQuery.addEventListener === 'function') {
      mobileMediaQuery.addEventListener('change', markReady)
      return () => {
        mobileMediaQuery.removeEventListener('change', markReady)
      }
    }

    mobileMediaQuery.addListener(markReady)
    return () => {
      mobileMediaQuery.removeListener(markReady)
    }
  }, [deferActionsUntilIdle, isJsdom, shouldLoadMobileMenu])

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

        <div
          className="order-3 hidden w-full justify-start overflow-x-auto pb-1 sm:flex sm:justify-center md:order-none md:w-auto md:justify-self-center md:overflow-visible md:pb-0"
          data-testid="public-site-nav-shell">
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

        <div
          className="ml-auto flex shrink-0 items-center justify-end sm:hidden"
          data-testid="public-site-mobile-menu">
          {shouldLoadMobileMenu ? (
            <DeferredPublicSiteHeaderMobileMenu
              apiBaseUrl={apiBaseUrl}
              locale={locale}
            />
          ) : (
            <MobileMenuFallback
              ariaLabel={t('mobileMenuAriaLabel')}
              onReady={() => setShouldLoadMobileMenu(true)}
            />
          )}
        </div>

        <div
          className="ml-auto hidden shrink-0 flex-nowrap items-center justify-end gap-2 sm:flex md:justify-self-end"
          data-testid="public-site-desktop-actions">
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

          {shouldLoadDesktopActions ? (
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
        className="h-[30px] w-[30px] rounded-full"
        data-testid="public-site-header-action-skeleton"
      />
      <Skeleton
        className="h-[30px] w-12 rounded-full"
        data-testid="public-site-theme-switch-skeleton"
      />
      <Skeleton
        className="h-[30px] w-[30px] rounded-full"
        data-testid="public-site-header-action-skeleton"
      />
    </div>
  )
}

function MobileMenuFallback({
  ariaLabel,
  onReady,
}: {
  ariaLabel: string
  onReady: () => void
}) {
  return (
    <button
      aria-label={ariaLabel}
      className={styles.headerActionTrigger}
      data-testid="public-site-mobile-menu-trigger-fallback"
      onClick={onReady}
      onFocus={onReady}
      onPointerEnter={onReady}
      type="button">
      <MenuIcon className="h-4 w-4" />
    </button>
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
