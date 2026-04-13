'use client'

import { Button } from '@heroui/react/button'
import { Tooltip } from '@heroui/react/tooltip'

import { useRouter } from '@i18n/navigation'
import type { AppLocale } from '@i18n/types'
import { getAdminNavigationItems } from '../utils/admin-navigation'
import {
  navBadgeBaseClass,
  navBadgeCollapsedClass,
  navButtonActiveClass,
  navButtonBaseClass,
  navButtonCollapsedClass,
} from './protected-layout.constants'
import { AdminNavIcon } from './protected-layout-icons'

export function AdminNavItems({
  collapsed = false,
  currentPathname,
  locale,
  onNavigate,
}: {
  collapsed?: boolean
  currentPathname: string
  locale: AppLocale
  onNavigate?: () => void
}) {
  const router = useRouter()
  const adminNavigationItems = getAdminNavigationItems(locale)

  return (
    <div className={collapsed ? 'flex w-full flex-col items-center gap-2' : 'flex flex-col gap-2'}>
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
              isActive && !collapsed ? navButtonActiveClass : '',
            ]
              .join(' ')
              .trim()}
            fullWidth={!collapsed}
            onClick={() => {
              onNavigate?.()
              router.push(item.href)
            }}
            size="sm"
            type="button"
            variant="ghost">
            <span
              className={[
                navBadgeBaseClass,
                collapsed ? navBadgeCollapsedClass : '',
                collapsed && isActive
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-400/18 dark:text-blue-50'
                  : '',
              ]
                .join(' ')
                .trim()}>
              <AdminNavIcon itemKey={item.key} size={collapsed ? 24 : 18} />
            </span>
            {!collapsed ? (
              <span className="min-w-0 flex-1 whitespace-nowrap text-left">{item.title}</span>
            ) : null}
          </Button>
        )

        if (!collapsed) {
          return <div key={item.href}>{navButton}</div>
        }

        return (
          <Tooltip delay={160} key={item.href}>
            <Tooltip.Trigger>
              <div className="flex w-full justify-center">{navButton}</div>
            </Tooltip.Trigger>
            <Tooltip.Content offset={10} placement="right">
              {item.title}
            </Tooltip.Content>
          </Tooltip>
        )
      })}
    </div>
  )
}
