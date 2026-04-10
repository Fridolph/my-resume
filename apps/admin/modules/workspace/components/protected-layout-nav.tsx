'use client'

import { Button } from '@heroui/react/button'
import { Tooltip } from '@heroui/react/tooltip'
import { useRouter } from 'next/navigation'

import { adminNavigationItems } from '../utils/admin-navigation'
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
