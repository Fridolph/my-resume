'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@heroui/react/card'
import { Button } from '@heroui/react/button'
import { Separator } from '@heroui/react/separator'

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
  sidebarCollapsed,
  onToggle,
}: {
  currentPathname: string
  sidebarCollapsed: boolean
  onToggle: () => void
}) {
  return (
    <aside className={sidebarShellClass}>
      <Card className="h-screen rounded-none border-none bg-transparent p-1! shadow-none">
        <CardHeader
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
              <CardTitle className="text-lg">resume admin</CardTitle>
              <CardDescription>
                标准后台壳，继续只消费 NestJS 提供的业务能力。
              </CardDescription>
            </div>
          ) : null}
        </CardHeader>
        <CardContent
          className={[sidebarContentClass, sidebarCollapsed ? sidebarContentCollapsedClass : '']
            .join(' ')
            .trim()}>
          <AdminNavItems collapsed={sidebarCollapsed} currentPathname={currentPathname} />
          <Separator className="my-[0.2rem] mt-[0.3rem]" />
          <div className="mt-auto hidden md:block" />
        </CardContent>
      </Card>
    </aside>
  )
}
