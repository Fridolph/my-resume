'use client'

import { Button } from '@heroui/react/button'

import { useRouter } from '../../../i18n/navigation'
import type { AppLocale } from '../../../i18n/types'
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
          <div key={item.href} title={item.title}>
            {navButton}
          </div>
        )
      })}
    </div>
  )
}
