'use client';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Chip,
  Drawer,
  DrawerBackdrop,
  DrawerBody,
  DrawerContent,
  DrawerDialog,
  DrawerHeader,
  DrawerHeading,
  Separator,
  Tooltip,
  useOverlayState,
} from '@heroui/react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';

import { adminNavigationItems, getAdminPageMeta } from '../lib/admin-navigation';
import { useAdminSession } from '../lib/admin-session';
import { ThemeModeToggle } from './theme-mode-toggle';

function AdminNavIcon({ itemKey }: { itemKey: (typeof adminNavigationItems)[number]['key'] }) {
  if (itemKey === 'overview') {
    return (
      <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18">
        <rect height="7" rx="2" stroke="currentColor" strokeWidth="1.8" width="7" x="3.5" y="3.5" />
        <rect height="7" rx="2" stroke="currentColor" strokeWidth="1.8" width="9" x="11.5" y="3.5" />
        <rect height="9" rx="2" stroke="currentColor" strokeWidth="1.8" width="7" x="3.5" y="11.5" />
        <rect height="9" rx="2" stroke="currentColor" strokeWidth="1.8" width="9" x="11.5" y="11.5" />
      </svg>
    );
  }

  if (itemKey === 'resume') {
    return (
      <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18">
        <path d="M7 4.5h7l4 4v10A1.5 1.5 0 0 1 16.5 20h-9A1.5 1.5 0 0 1 6 18.5v-12A2 2 0 0 1 8 4.5Z" stroke="currentColor" strokeWidth="1.8" />
        <path d="M13.5 4.5v4h4" stroke="currentColor" strokeWidth="1.8" />
        <path d="M9 12h6M9 15.5h6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      </svg>
    );
  }

  if (itemKey === 'ai') {
    return (
      <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18">
        <rect height="11" rx="3" stroke="currentColor" strokeWidth="1.8" width="14" x="5" y="7" />
        <path d="M9 3.5v3M15 3.5v3M9 18v2.5M15 18v2.5M3.5 10H5M19 10h1.5M3.5 15H5M19 15h1.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
        <path d="M9.5 12h5M12 9.5v5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18">
      <path d="M6 7.5h12M6 12h12M6 16.5h7" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <path d="M17 14.5 20.5 18 17 21.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M20.5 18H12" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function AdminNavItems({
  collapsed = false,
  currentPathname,
  onNavigate,
}: {
  collapsed?: boolean;
  currentPathname: string;
  onNavigate?: () => void;
}) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-2">
      {adminNavigationItems.map((item) => {
        const isActive =
          item.href === '/dashboard'
            ? currentPathname === item.href
            : currentPathname.startsWith(item.href);

        const navButton = (
          <Button
            aria-current={isActive ? 'page' : undefined}
            aria-label={item.title}
            className={
              collapsed
                ? isActive
                  ? 'admin-nav-item is-active is-collapsed'
                  : 'admin-nav-item is-collapsed'
                : isActive
                  ? 'admin-nav-item is-active'
                  : 'admin-nav-item'
            }
            fullWidth
            onClick={() => {
              onNavigate?.();
              router.push(item.href);
            }}
            size="sm"
            type="button"
            variant="ghost"
          >
            <span className="admin-nav-item-badge">
              <AdminNavIcon itemKey={item.key} />
            </span>
            {!collapsed ? (
              <span className="admin-nav-item-label">{item.title}</span>
            ) : null}
          </Button>
        );

        if (!collapsed) {
          return (
            <div key={item.href}>
              {navButton}
            </div>
          );
        }

        return (
          <Tooltip key={item.href}>
            <Tooltip.Trigger>{navButton}</Tooltip.Trigger>
            <Tooltip.Content offset={12} placement="right">
              {item.title}
            </Tooltip.Content>
          </Tooltip>
        );
      })}
    </div>
  );
}

export function AdminProtectedLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const drawerState = useOverlayState();
  const { currentUser, logout, status } = useAdminSession();
  const pageMeta = getAdminPageMeta(pathname);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const storedValue = window.localStorage.getItem(
      'my-resume-admin-sidebar-collapsed',
    );

    setSidebarCollapsed(storedValue === 'true');
  }, []);

  function toggleSidebarCollapsed() {
    setSidebarCollapsed((current) => {
      const nextValue = !current;

      window.localStorage.setItem(
        'my-resume-admin-sidebar-collapsed',
        String(nextValue),
      );

      return nextValue;
    });
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
    );
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
                当前路由属于受保护后台，需要先读取本地 token 并向 `/auth/me` 校验当前登录态。
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
              <Link className="link-button" href="/">返回登录页</Link>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-zinc-100 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
        <div
          className="grid min-h-screen w-full grid-cols-1 md:[grid-template-columns:var(--admin-sidebar-width)_minmax(0,1fr)]"
          style={{ '--admin-sidebar-width': sidebarCollapsed ? '88px' : '176px' } as CSSProperties}
        >
          <aside className="admin-sidebar-shell hidden border-none bg-transparent md:block">
            <Card className="admin-sidebar-card p-1! rounded-none border-none bg-transparent shadow-none">
              <CardHeader
                className={
                  sidebarCollapsed
                    ? 'admin-sidebar-header is-collapsed'
                    : 'admin-sidebar-header'
                }
              >
                <div
                  className={
                    sidebarCollapsed
                      ? 'admin-sidebar-brand is-collapsed'
                      : 'admin-sidebar-brand'
                  }
                >
                  <Button
                    aria-label={sidebarCollapsed ? '展开侧边栏' : '折叠侧边栏'}
                    className="sidebar-toggle-button"
                    isIconOnly
                    onClick={toggleSidebarCollapsed}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    {sidebarCollapsed ? '>' : '<'}
                  </Button>
                  <div className="admin-sidebar-logo">
                    MR
                  </div>
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
                className={
                  sidebarCollapsed
                    ? 'admin-sidebar-content is-collapsed'
                    : 'admin-sidebar-content'
                }
              >
                <AdminNavItems
                  collapsed={sidebarCollapsed}
                  currentPathname={pathname}
                />
                <Separator className="sidebar-separator" />
                {!sidebarCollapsed ? (
                  <div className="mt-auto space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">
                      当前会话
                    </p>
                    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white dark:bg-white dark:text-zinc-950">
                          {currentUser.username.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-semibold">{currentUser.username}</p>
                          <Chip size="sm">{currentUser.role}</Chip>
                        </div>
                      </div>
                      <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                        当前后台 UI 只负责组织信息和触发入口，业务逻辑继续统一在 `apps/server`。
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-auto flex justify-center">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-base font-semibold dark:border-zinc-800 dark:bg-zinc-900/70">
                      {currentUser.username.slice(0, 1).toUpperCase()}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </aside>

          <div className="flex min-h-screen flex-col">
            <header className="sticky top-0 z-20 border-b border-zinc-200/70 bg-white/78 px-4 py-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/78 lg:px-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-start gap-3">
                  <Button
                    className="secondary-button h-10 min-w-0 px-3 text-sm md:hidden"
                    onClick={drawerState.open}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    菜单
                  </Button>
                  <div className="space-y-2">
                    <div className="header-page-meta-row">
                      <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
                        {pageMeta.title}
                      </h1>
                      <span className="header-page-badge">{pageMeta.eyebrow}</span>
                      <p className="header-page-description">
                        {pageMeta.description}
                      </p>
                    </div>
                    <nav aria-label="Breadcrumbs" className="text-sm text-zinc-500 dark:text-zinc-400">
                      <ol className="flex items-center gap-2">
                        <li>
                          <Link href="/dashboard">后台</Link>
                        </li>
                        <li>/</li>
                        <li aria-current="page">{pageMeta.title}</li>
                      </ol>
                    </nav>
                  </div>
                </div>

                <div className="header-actions">
                  <div className="header-session-pills">
                    <Chip size="sm">账号：{currentUser.username}</Chip>
                    <Chip size="sm">角色：{currentUser.role}</Chip>
                  </div>
                  <ThemeModeToggle />
                  <Button
                    className="header-text-button"
                    size="sm"
                    onClick={() => {
                      logout();
                      router.replace('/');
                    }}
                    type="button"
                    variant="ghost"
                  >
                    退出登录
                  </Button>
                </div>
              </div>
            </header>

            <main className="flex-1 px-4 py-5 md:px-5 md:py-6 xl:px-8">
              <div className="flex w-full flex-col gap-6">
                {children}
              </div>
            </main>
          </div>
        </div>
      </div>

      <Drawer state={drawerState}>
        <DrawerBackdrop />
        <DrawerContent placement="left">
          <DrawerDialog>
            <DrawerHeader>
              <DrawerHeading>后台导航</DrawerHeading>
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
                onNavigate={() => drawerState.close()}
              />
            </DrawerBody>
          </DrawerDialog>
        </DrawerContent>
      </Drawer>
    </>
  );
}
