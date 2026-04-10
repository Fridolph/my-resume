'use client'

import { Button } from '@heroui/react/button'

import type { AppLocale } from '@/i18n/types'
import {
  sidebarBrandClass,
  sidebarBrandCollapsedClass,
  sidebarContentClass,
  sidebarContentCollapsedClass,
  sidebarHeaderClass,
  sidebarHeaderCollapsedClass,
  sidebarLogoClass,
  sidebarShellClass,
  sidebarToggleButtonClass,
} from './protected-layout.constants'
import { AdminNavItems } from './protected-layout-nav'

export function AdminSidebar({
  currentPathname,
  locale,
  onToggle,
  sidebarCollapsed,
}: {
  currentPathname: string
  locale: AppLocale
  sidebarCollapsed: boolean
  onToggle: () => void
}) {
  return (
    <aside className={sidebarShellClass}>
      <div className="flex h-screen flex-col rounded-none border-none bg-transparent p-1 shadow-none">
        <div
          className={[sidebarHeaderClass, sidebarCollapsed ? sidebarHeaderCollapsedClass : '']
            .join(' ')
            .trim()}>
          <div
            className={[sidebarBrandClass, sidebarCollapsed ? sidebarBrandCollapsedClass : '']
              .join(' ')
              .trim()}>
            <Button
              aria-label={sidebarCollapsed ? '展开侧边栏' : '折叠侧边栏'}
              className={sidebarToggleButtonClass}
              isIconOnly
              onClick={onToggle}
              size="sm"
              type="button"
              variant="outline">
              {sidebarCollapsed ? '>' : '<'}
            </Button>
            <div className={sidebarLogoClass}>MR</div>
          </div>
          {!sidebarCollapsed ? (
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-zinc-950 dark:text-white">
                resume admin
              </h2>
              <p className="text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                标准后台壳，继续只消费 NestJS 提供的业务能力。
              </p>
            </div>
          ) : null}
        </div>
        <div
          className={[sidebarContentClass, sidebarCollapsed ? sidebarContentCollapsedClass : '']
            .join(' ')
            .trim()}>
          <AdminNavItems
            collapsed={sidebarCollapsed}
            currentPathname={currentPathname}
            locale={locale}
          />
          <div
            aria-hidden="true"
            className="my-[0.2rem] mt-[0.3rem] h-px w-full bg-zinc-200/70 dark:bg-white/8"
          />
          <div className="mt-auto hidden md:block" />
        </div>
      </div>
    </aside>
  )
}
