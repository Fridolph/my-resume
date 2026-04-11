'use client'

import dynamic from 'next/dynamic'
import { Skeleton } from '@heroui/react/skeleton'
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'

import { Link, usePathname, useRouter } from '@core/i18n/navigation'
import { getAdminPageMeta } from './utils/admin-navigation'
import { useAdminSession } from '@core/admin-session'
import type { AppLocale } from '@core/i18n/types'
import { AdminHeader } from './components/protected-layout-header'
import { AdminSidebar } from './components/protected-layout-sidebar'

const AdminHeaderActions = dynamic(
  () =>
    import('./components/protected-layout-header-actions').then((module) => module.AdminHeaderActions),
  {
    loading: () => (
      <div
        className="flex shrink-0 items-center justify-end gap-2 sm:gap-2.5"
        data-testid="admin-header-actions-loading">
        <Skeleton className="h-[30px] w-[30px] rounded-full border border-zinc-200/80 bg-zinc-100/85 dark:border-white/8 dark:bg-white/[0.06]" />
        <Skeleton className="h-7 w-12 rounded-full border border-zinc-200/80 bg-zinc-100/85 dark:border-white/8 dark:bg-white/[0.06]" />
        <Skeleton className="h-[30px] w-[30px] rounded-full border border-zinc-200/80 bg-zinc-100/85 dark:border-white/8 dark:bg-white/[0.06]" />
      </div>
    ),
  },
)

const AdminMobileDrawer = dynamic(
  () => import('./components/protected-layout-mobile-drawer').then((module) => module.AdminMobileDrawer),
)

/**
 * 后台受保护布局负责会话校验后的工作区壳、导航和主区域编排
 *
 * @param children 当前路由对应的后台页面内容
 * @returns 后台受保护工作区布局
 */
export function AdminProtectedLayout({ children }: { children: ReactNode }) {
  return <AdminProtectedLayoutWithLocale locale="zh">{children}</AdminProtectedLayoutWithLocale>
}

export function AdminProtectedLayoutWithLocale({
  children,
  locale,
}: {
  children: ReactNode
  locale: AppLocale
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { currentUser, logout, status } = useAdminSession()
  const pageMeta = getAdminPageMeta(pathname, locale)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false)
  const hasHydratedRouteRef = useRef(false)

  useEffect(() => {
    // 侧栏折叠态属于纯前端体验状态，只持久化在 localStorage
    const storedValue = window.localStorage.getItem('my-resume-admin-sidebar-collapsed')

    setSidebarCollapsed(storedValue === 'true')
  }, [])

  useEffect(() => {
    if (!hasHydratedRouteRef.current) {
      hasHydratedRouteRef.current = true
      return
    }

    setIsMobileDrawerOpen(false)
  }, [pathname])

  /**
   * 切换后台侧栏折叠态，并把布局偏好保存在本地
   */
  function toggleSidebarCollapsed() {
    setSidebarCollapsed((current) => {
      const nextValue = !current

      window.localStorage.setItem('my-resume-admin-sidebar-collapsed', String(nextValue))

      return nextValue
    })
  }

  if (status === 'loading') {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-8">
        <section className="w-full max-w-md rounded-[28px] border border-zinc-200/70 bg-white/92 px-6 py-10 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-950/80">
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              正在校验后台登录态
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
              后台壳加载中
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              请稍候，当前会继续向 `apps/server` 校验 `/auth/me`。
            </p>
            <div className="mt-2 grid gap-2" data-testid="admin-session-loading-skeleton">
              <Skeleton className="h-4 rounded-md bg-zinc-200/80 dark:bg-zinc-800/80" />
              <Skeleton className="h-4 w-4/5 rounded-md bg-zinc-200/80 dark:bg-zinc-800/80" />
            </div>
          </div>
        </section>
      </main>
    )
  }

  if (status === 'unauthorized' || !currentUser) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-8">
        <section className="w-full max-w-xl rounded-[32px] border border-zinc-200/70 bg-white/92 px-6 py-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/80">
          <div className="pb-0">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">
                未登录
              </p>
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
                请先登录后台
              </h1>
              <p className="text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                当前路由属于受保护后台，需要先读取本地 token 并向 `/auth/me`
                校验当前登录态。
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-4 pt-6">
            <div className="readonly-box">
              <p className="font-medium">当前后台继续保持前端壳鉴权模式</p>
              <p className="text-sm">
                本轮只做 UI 与信息架构升级，不改为 cookie / middleware 方案。
              </p>
            </div>
            <div className="flex gap-3">
              <Link className="link-button" href="/" prefetch={false}>
                返回登录页
              </Link>
            </div>
          </div>
        </section>
      </main>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-zinc-100 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
        <div
          className="grid min-h-screen w-full grid-cols-1 md:gap-4 md:[grid-template-columns:var(--admin-sidebar-width)_minmax(0,1fr)] xl:gap-5"
          style={
            {
              '--admin-sidebar-width': sidebarCollapsed ? '104px' : '220px',
            } as CSSProperties
          }>
          <AdminSidebar
            currentPathname={pathname}
            locale={locale}
            onToggle={toggleSidebarCollapsed}
            sidebarCollapsed={sidebarCollapsed}
          />

          <div className="flex min-h-screen flex-col">
            <AdminHeader
              actions={
                <AdminHeaderActions
                  currentUser={currentUser}
                  onLogout={() => {
                    logout()
                    router.replace('/', { locale })
                  }}
                />
              }
              onOpenMenu={() => setIsMobileDrawerOpen(true)}
              pageMeta={pageMeta}
            />

            <main className="flex-1 py-5 md:py-6">
              <div className="flex w-full flex-col gap-6">{children}</div>
            </main>
          </div>
        </div>
      </div>

      <AdminMobileDrawer
        currentPathname={pathname}
        currentUser={currentUser}
        isOpen={isMobileDrawerOpen}
        locale={locale}
        onNavigate={() => setIsMobileDrawerOpen(false)}
        onOpenChange={setIsMobileDrawerOpen}
      />
    </>
  )
}
