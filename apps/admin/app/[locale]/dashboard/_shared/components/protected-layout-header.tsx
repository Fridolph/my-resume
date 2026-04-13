'use client'

import { Button } from '@heroui/react/button'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'

import { Link } from '@i18n/navigation'
import type { AdminNavigationItem } from '../types/admin-navigation.types'
import {
  headerBodyClass,
  headerPageBadgeClass,
  headerPageDescriptionClass,
  headerPageMetaRowClass,
  headerPrimaryContentClass,
  headerSecondaryMetaClass,
  headerShellClass,
  headerTextStackClass,
  headerTitleClass,
} from './protected-layout.constants'

export function AdminHeader({
  actions,
  onOpenMenu,
  pageMeta,
}: {
  actions: ReactNode
  onOpenMenu: () => void
  pageMeta: AdminNavigationItem
}) {
  const t = useTranslations('workspace')

  return (
    <header className={headerShellClass} data-testid="admin-mobile-header">
      <div className={headerBodyClass}>
        <div className={headerPrimaryContentClass}>
          <Button
            className="secondary-button h-9 min-w-0 px-3 text-sm sm:h-10 md:hidden"
            onClick={onOpenMenu}
            size="sm"
            type="button"
            variant="outline">
            {t('menuButton')}
          </Button>
          <div className={headerTextStackClass}>
            <div className={headerPageMetaRowClass}>
              <h1 className={headerTitleClass}>{pageMeta.title}</h1>
              <span className={headerPageBadgeClass}>{pageMeta.eyebrow}</span>
            </div>
            <div className={headerSecondaryMetaClass} data-testid="admin-mobile-header-secondary">
              <p className={headerPageDescriptionClass}>{pageMeta.description}</p>
              <nav aria-label="Breadcrumbs" className="text-sm text-zinc-500 dark:text-zinc-400">
                <ol className="flex items-center gap-2">
                  <li>
                    <Link href="/dashboard">
                      {t('dashboardBreadcrumb')}
                    </Link>
                  </li>
                  <li>/</li>
                  <li aria-current="page">{pageMeta.title}</li>
                </ol>
              </nav>
            </div>
          </div>
        </div>

        {actions}
      </div>
    </header>
  )
}
