'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@heroui/react/card'
import { Avatar } from '@heroui/react/avatar'
import { Button } from '@heroui/react/button'
import {
  Dropdown,
} from '@heroui/react/dropdown'
import {
  Drawer,
  DrawerBackdrop,
  DrawerBody,
  DrawerCloseTrigger,
  DrawerContent,
  DrawerDialog,
  DrawerHeader,
  DrawerHeading,
} from '@heroui/react/drawer'
import { Separator } from '@heroui/react/separator'
import { Tooltip } from '@heroui/react/tooltip'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'

import { adminNavigationItems, getAdminPageMeta } from '../../lib/admin-navigation'
import { useAdminSession } from '../../lib/admin-session'
import { ThemeModeToggle } from '../shared/theme-mode-toggle'

const navButtonBaseClass =
  'inline-flex w-full items-center justify-start gap-2 rounded-xl border border-transparent px-[0.35rem] py-1.5 text-[0.88rem] font-semibold text-zinc-500 transition-[background-color,border-color,color] duration-150 hover:bg-zinc-100/90 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-zinc-50'
const navButtonActiveClass =
  'border-blue-200/80 bg-blue-50/90 text-zinc-900 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-zinc-50'
const navButtonCollapsedClass =
  'h-14 w-14 min-h-14 justify-center rounded-[18px] px-0 py-0'
const navBadgeBaseClass =
  'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] bg-zinc-100/90 text-current dark:bg-white/[0.06]'
const navBadgeCollapsedClass = 'h-10 w-10 bg-transparent'
const sidebarShellClass =
  'sticky top-0 hidden h-screen self-start border-none bg-transparent md:block'
const sidebarHeaderClass = 'flex flex-col items-stretch gap-4 px-3 py-4 pb-3'
const sidebarHeaderCollapsedClass = 'items-center px-[0.55rem]'
const sidebarBrandClass = 'flex w-full items-center justify-between gap-2'
const sidebarBrandCollapsedClass = 'flex-col justify-start gap-3'
const sidebarToggleButtonClass =
  'inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200/80 bg-zinc-100 text-sm font-bold text-zinc-500 dark:border-white/8 dark:bg-white/[0.06] dark:text-zinc-300'
const sidebarLogoClass =
  'flex h-12 w-12 items-center justify-center rounded-[18px] bg-zinc-900 text-[1.15rem] font-extrabold tracking-[-0.04em] text-white dark:bg-white dark:text-zinc-950'
const sidebarContentClass = 'flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-3 pb-4'
const sidebarContentCollapsedClass = 'items-center px-[0.55rem]'
const headerPageMetaRowClass =
  'flex min-w-0 flex-wrap items-center gap-2 sm:gap-2.5 md:overflow-x-auto md:flex-nowrap md:gap-3 md:whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
const headerPageBadgeClass =
  'inline-flex min-h-6 items-center rounded-full border border-blue-500/20 bg-blue-50 px-2.5 text-[0.72rem] font-bold tracking-[0.04em] text-blue-700 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-300'
const headerPageDescriptionClass =
  'm-0 text-[0.82rem] leading-[1.5] text-[#999] sm:text-[0.88rem] md:text-xs md:leading-[1.4]'
const headerActionsClass = 'flex shrink-0 items-center justify-end gap-2 sm:gap-2.5'
const headerShellClass =
  'sticky top-0 z-20 border-b border-zinc-200/70 bg-white/78 px-3 py-2.5 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/78 sm:px-4 sm:py-3 md:rounded-[28px] md:border md:px-5 lg:px-6'
const headerBodyClass = 'flex items-start justify-between gap-3 sm:gap-4'
const headerPrimaryContentClass = 'flex min-w-0 flex-1 items-start gap-2.5 sm:gap-3'
const headerTextStackClass = 'min-w-0 flex-1 space-y-1.5 sm:space-y-2'
const headerSecondaryMetaClass = 'grid gap-1 sm:gap-1.5'
const headerTitleClass =
  'text-[2rem] leading-none font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-[2.15rem] md:text-2xl'
const headerIconButtonClass =
  'inline-flex h-[30px] w-[30px] min-w-[30px] items-center justify-center rounded-full border border-zinc-200/80 bg-zinc-100/85 p-0 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/15 dark:border-white/8 dark:bg-white/[0.06] dark:text-zinc-300 dark:hover:bg-white/[0.08] dark:hover:text-white'
const headerAvatarButtonClass =
  'inline-flex h-[30px] w-[30px] min-w-[30px] items-center justify-center rounded-full border border-zinc-200/80 bg-zinc-100/85 p-0 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/15 dark:border-white/8 dark:bg-white/[0.06] dark:text-zinc-300 dark:hover:bg-white/[0.08] dark:hover:text-white'
const headerAvatarClass =
  'h-[22px] w-[22px] rounded-full bg-zinc-900 text-[0.66rem] font-bold text-white dark:bg-white dark:text-zinc-950'
const sessionDropdownPopoverClass = 'min-w-[220px]'
const sessionDropdownMenuClass = 'p-[0.35rem]'
const sessionDropdownItemContentClass = 'grid gap-0.5'
const sessionDropdownItemLabelClass = 'text-[0.72rem] text-zinc-500 dark:text-zinc-400'
const sessionDropdownItemValueClass = 'text-[0.88rem] font-semibold'
const mobileDrawerBackdropClass = 'z-40 pointer-events-none'
const mobileDrawerContentClass = 'z-50'
const mobileDrawerDialogClass =
  'border-r border-zinc-200/70 bg-white/95 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950/95'
const mobileDrawerCloseButtonClass =
  'inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200/80 bg-zinc-100/90 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:border-white/8 dark:bg-white/[0.06] dark:text-zinc-300 dark:hover:bg-white/[0.08] dark:hover:text-white'

function AdminNavIcon({
  itemKey,
  size = 18,
}: {
  itemKey: (typeof adminNavigationItems)[number]['key']
  size?: number
}) {
  if (itemKey === 'overview') {
    return (
      <svg aria-hidden="true" fill="none" height={size} viewBox="0 0 24 24" width={size}>
        <rect
          height="7"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.8"
          width="7"
          x="3.5"
          y="3.5"
        />
        <rect
          height="7"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.8"
          width="9"
          x="11.5"
          y="3.5"
        />
        <rect
          height="9"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.8"
          width="7"
          x="3.5"
          y="11.5"
        />
        <rect
          height="9"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.8"
          width="9"
          x="11.5"
          y="11.5"
        />
      </svg>
    )
  }

  if (itemKey === 'resume') {
    return (
      <svg aria-hidden="true" fill="none" height={size} viewBox="0 0 24 24" width={size}>
        <path
          d="M7 4.5h7l4 4v10A1.5 1.5 0 0 1 16.5 20h-9A1.5 1.5 0 0 1 6 18.5v-12A2 2 0 0 1 8 4.5Z"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path d="M13.5 4.5v4h4" stroke="currentColor" strokeWidth="1.8" />
        <path
          d="M9 12h6M9 15.5h6"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.8"
        />
      </svg>
    )
  }

  if (itemKey === 'ai') {
    return (
      <svg aria-hidden="true" fill="none" height={size} viewBox="0 0 24 24" width={size}>
        <rect
          height="11"
          rx="3"
          stroke="currentColor"
          strokeWidth="1.8"
          width="14"
          x="5"
          y="7"
        />
        <path
          d="M9 3.5v3M15 3.5v3M9 18v2.5M15 18v2.5M3.5 10H5M19 10h1.5M3.5 15H5M19 15h1.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.8"
        />
        <path
          d="M9.5 12h5M12 9.5v5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.8"
        />
      </svg>
    )
  }

  return (
    <svg aria-hidden="true" fill="none" height={size} viewBox="0 0 24 24" width={size}>
      <path
        d="M6 7.5h12M6 12h12M6 16.5h7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
      <path
        d="M17 14.5 20.5 18 17 21.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M20.5 18H12"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function GithubIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="currentColor"
      height="18"
      viewBox="0 0 24 24"
      width="18">
      <path d="M12 .75a11.25 11.25 0 0 0-3.56 21.92c.56.1.77-.24.77-.54V20.1c-3.12.68-3.78-1.32-3.78-1.32-.5-1.3-1.25-1.63-1.25-1.63-1.02-.7.08-.68.08-.68 1.12.08 1.7 1.14 1.7 1.14 1 1.72 2.6 1.22 3.24.94.1-.72.38-1.22.68-1.5-2.5-.28-5.12-1.24-5.12-5.54 0-1.22.44-2.22 1.16-3-.12-.28-.5-1.44.12-3 0 0 .96-.3 3.14 1.16a10.82 10.82 0 0 1 5.72 0c2.18-1.46 3.14-1.16 3.14-1.16.62 1.56.24 2.72.12 3 .72.78 1.16 1.78 1.16 3 0 4.3-2.62 5.26-5.12 5.54.4.36.76 1.06.76 2.14v3.17c0 .3.2.66.78.54A11.25 11.25 0 0 0 12 .75Z" />
    </svg>
  )
}

function AdminNavItems({
  collapsed = false,
  currentPathname,
  onNavigate,
}: {
  collapsed?: boolean
  currentPathname: string
  onNavigate?: () => void
}) {
  const router = useRouter()

  return (
    <div className="flex flex-col gap-2">
      {adminNavigationItems.map((item) => {
        const isActive =
          item.href === '/dashboard'
            ? currentPathname === item.href
            : currentPathname.startsWith(item.href)

        const navButton = (
          <Button
            aria-current={isActive ? 'page' : undefined}
            aria-label={item.title}
            className={[
              navButtonBaseClass,
              collapsed ? navButtonCollapsedClass : 'min-h-[42px]',
              isActive ? navButtonActiveClass : '',
            ]
              .join(' ')
              .trim()}
            fullWidth
            onClick={() => {
              onNavigate?.()
              router.push(item.href)
            }}
            size="sm"
            type="button"
            variant="ghost">
            <span
              className={[navBadgeBaseClass, collapsed ? navBadgeCollapsedClass : '']
                .join(' ')
                .trim()}>
              <AdminNavIcon itemKey={item.key} size={collapsed ? 24 : 18} />
            </span>
            {!collapsed ? (
              <span className="min-w-0 whitespace-nowrap">{item.title}</span>
            ) : null}
          </Button>
        )

        if (!collapsed) {
          return <div key={item.href}>{navButton}</div>
        }

        return (
          <Tooltip key={item.href}>
            <Tooltip.Trigger>{navButton}</Tooltip.Trigger>
            <Tooltip.Content offset={12} placement="right">
              {item.title}
            </Tooltip.Content>
          </Tooltip>
        )
      })}
    </div>
  )
}

export function AdminProtectedLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { currentUser, logout, status } = useAdminSession()
  const pageMeta = getAdminPageMeta(pathname)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false)
  const hasHydratedRouteRef = useRef(false)

  useEffect(() => {
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
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col gap-3 py-10 text-center">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              正在校验后台登录态
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
              后台壳加载中
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              请稍候，当前会继续向 `apps/server` 校验 `/auth/me`。
            </p>
          </CardContent>
        </Card>
      </main>
    )
  }

  if (status === 'unauthorized' || !currentUser) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-8">
        <Card className="w-full max-w-xl">
          <CardHeader className="pb-0">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">
                未登录
              </p>
              <CardTitle className="text-2xl">请先登录后台</CardTitle>
              <CardDescription>
                当前路由属于受保护后台，需要先读取本地 token 并向 `/auth/me`
                校验当前登录态。
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 pt-6">
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
          </CardContent>
        </Card>
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
              '--admin-sidebar-width': sidebarCollapsed ? '88px' : '176px',
            } as CSSProperties
          }>
          <aside className={sidebarShellClass}>
            <Card className="h-screen rounded-none border-none bg-transparent p-1! shadow-none">
              <CardHeader
                className={[
                  sidebarHeaderClass,
                  sidebarCollapsed ? sidebarHeaderCollapsedClass : '',
                ]
                  .join(' ')
                  .trim()}>
                <div
                  className={[
                    sidebarBrandClass,
                    sidebarCollapsed ? sidebarBrandCollapsedClass : '',
                  ]
                    .join(' ')
                    .trim()}>
                  <Button
                    aria-label={sidebarCollapsed ? '展开侧边栏' : '折叠侧边栏'}
                    className={sidebarToggleButtonClass}
                    isIconOnly
                    onClick={toggleSidebarCollapsed}
                    size="sm"
                    type="button"
                    variant="outline">
                    {sidebarCollapsed ? '>' : '<'}
                  </Button>
                  <div className={sidebarLogoClass}>MR</div>
                </div>
                {!sidebarCollapsed ? (
                  <div className="space-y-1">
                    <CardTitle className="text-lg">resume admin</CardTitle>
                    <CardDescription>
                      标准后台壳，继续只消费 NestJS 提供的业务能力。
                    </CardDescription>
                  </div>
                ) : null}
              </CardHeader>
              <CardContent
                className={[
                  sidebarContentClass,
                  sidebarCollapsed ? sidebarContentCollapsedClass : '',
                ]
                  .join(' ')
                  .trim()}>
                <AdminNavItems collapsed={sidebarCollapsed} currentPathname={pathname} />
                <Separator className="my-[0.2rem] mt-[0.3rem]" />
                <div className="mt-auto hidden md:block" />
              </CardContent>
            </Card>
          </aside>

          <div className="flex min-h-screen flex-col">
            <header className={headerShellClass} data-testid="admin-mobile-header">
              <div className={headerBodyClass}>
                <div className={headerPrimaryContentClass}>
                  <Button
                    className="secondary-button h-9 min-w-0 px-3 text-sm sm:h-10 md:hidden"
                    onClick={() => setIsMobileDrawerOpen(true)}
                    size="sm"
                    type="button"
                    variant="outline">
                    菜单
                  </Button>
                  <div className={headerTextStackClass}>
                    <div className={headerPageMetaRowClass}>
                      <h1 className={headerTitleClass}>{pageMeta.title}</h1>
                      <span className={headerPageBadgeClass}>{pageMeta.eyebrow}</span>
                    </div>
                    <div
                      className={headerSecondaryMetaClass}
                      data-testid="admin-mobile-header-secondary">
                      <p className={headerPageDescriptionClass}>{pageMeta.description}</p>
                      <nav
                        aria-label="Breadcrumbs"
                        className="text-sm text-zinc-500 dark:text-zinc-400">
                        <ol className="flex items-center gap-2">
                          <li>
                            <Link href="/dashboard" prefetch={false}>
                              后台
                            </Link>
                          </li>
                          <li>/</li>
                          <li aria-current="page">{pageMeta.title}</li>
                        </ol>
                      </nav>
                    </div>
                  </div>
                </div>

                <div className={headerActionsClass}>
                  <Tooltip>
                    <Tooltip.Trigger>
                      <Button
                        aria-label="打开项目 GitHub 仓库"
                        className={headerIconButtonClass}
                        isIconOnly
                        onClick={() => {
                          window.open(
                            'https://github.com/Fridolph/my-resume',
                            '_blank',
                            'noopener,noreferrer',
                          )
                        }}
                        size="sm"
                        type="button"
                        variant="ghost">
                        <GithubIcon />
                      </Button>
                    </Tooltip.Trigger>
                    <Tooltip.Content offset={10} placement="bottom">
                      GitHub 仓库
                    </Tooltip.Content>
                  </Tooltip>
                  <ThemeModeToggle />
                  <Dropdown>
                    <Dropdown.Trigger
                      aria-label="打开当前会话菜单"
                      className={headerAvatarButtonClass}>
                      <Avatar.Root
                        aria-hidden="true"
                        className={headerAvatarClass}
                        size="sm">
                        <Avatar.Fallback>
                          {currentUser.username.slice(0, 1).toUpperCase()}
                        </Avatar.Fallback>
                      </Avatar.Root>
                    </Dropdown.Trigger>
                    <Dropdown.Popover
                      className={sessionDropdownPopoverClass}
                      placement="bottom end">
                      <Dropdown.Menu
                        aria-label="当前会话菜单"
                        className={sessionDropdownMenuClass}
                        onAction={(key) => {
                          if (key === 'logout') {
                            logout()
                            router.replace('/')
                          }
                        }}>
                        <Dropdown.Item
                          id="session-user"
                          isDisabled
                          textValue={`账号：${currentUser.username}`}>
                          <div className={sessionDropdownItemContentClass}>
                            <span className={sessionDropdownItemLabelClass}>账号</span>
                            <span className={sessionDropdownItemValueClass}>
                              {currentUser.username}
                            </span>
                          </div>
                        </Dropdown.Item>
                        <Dropdown.Item
                          id="session-role"
                          isDisabled
                          textValue={`角色：${currentUser.role}`}>
                          <div className={sessionDropdownItemContentClass}>
                            <span className={sessionDropdownItemLabelClass}>角色</span>
                            <span className={sessionDropdownItemValueClass}>
                              {currentUser.role}
                            </span>
                          </div>
                        </Dropdown.Item>
                        <Dropdown.Item id="logout" textValue="退出登录">
                          <div className={sessionDropdownItemContentClass}>
                            <span className={sessionDropdownItemLabelClass}>操作</span>
                            <span className={sessionDropdownItemValueClass}>
                              退出登录
                            </span>
                          </div>
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown.Popover>
                  </Dropdown>
                </div>
              </div>
            </header>

            <main className="flex-1 py-5 md:py-6">
              <div className="flex w-full flex-col gap-6">{children}</div>
            </main>
          </div>
        </div>
      </div>

      <Drawer
        data-testid="admin-mobile-drawer-root"
        isOpen={isMobileDrawerOpen}
        key={pathname}
        onOpenChange={setIsMobileDrawerOpen}>
        <DrawerBackdrop
          className={mobileDrawerBackdropClass}
          isDismissable={false}
          variant="transparent"
        />
        <DrawerContent
          className={mobileDrawerContentClass}
          data-testid="admin-mobile-drawer-content"
          placement="left">
          <DrawerDialog
            className={mobileDrawerDialogClass}
            data-testid="admin-mobile-drawer-dialog">
            <DrawerHeader className="flex items-center justify-between gap-3">
              <DrawerHeading>后台导航</DrawerHeading>
              <DrawerCloseTrigger
                aria-label="关闭导航菜单"
                className={mobileDrawerCloseButtonClass}>
                <span aria-hidden="true">×</span>
              </DrawerCloseTrigger>
            </DrawerHeader>
            <DrawerBody className="space-y-5">
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
                <p className="text-sm font-semibold">{currentUser.username}</p>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {currentUser.role} · 快捷切换后台工作区
                </p>
              </div>
              <AdminNavItems
                currentPathname={pathname}
                onNavigate={() => setIsMobileDrawerOpen(false)}
              />
            </DrawerBody>
          </DrawerDialog>
        </DrawerContent>
      </Drawer>
    </>
  )
}
