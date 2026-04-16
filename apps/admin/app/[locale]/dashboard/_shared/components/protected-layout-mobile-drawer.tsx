'use client'

import { Button } from '@heroui/react/button'
import { useEffect } from 'react'

import type { AppLocale } from '@i18n/types'
import {
  mobileDrawerContentClass,
  mobileDrawerBackdropClass,
  mobileDrawerCloseButtonClass,
  mobileDrawerDialogClass,
} from './protected-layout.constants'
import { AdminNavItems } from './protected-layout-nav'

export function AdminMobileDrawer({
  currentPathname,
  currentUser,
  isOpen,
  locale,
  onNavigate,
  onOpenChange,
}: {
  currentPathname: string
  currentUser: {
    username: string
    role: string
  }
  isOpen: boolean
  locale: AppLocale
  onNavigate: () => void
  onOpenChange: (open: boolean) => void
}) {
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        onOpenChange(false)
      }
    }

    window.addEventListener('keydown', handleEscape)

    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onOpenChange])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen])

  return (
    <div data-open={String(isOpen)} data-testid="admin-mobile-drawer-root">
      <Button
        aria-label="关闭导航菜单遮罩"
        className={[
          mobileDrawerBackdropClass,
          isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        ]
          .join(' ')
          .trim()}
        onPress={() => onOpenChange(false)}
        type="button"
        variant="ghost"
      />
      <div
        className={[
          mobileDrawerContentClass,
          isOpen ? 'pointer-events-auto' : 'pointer-events-none',
        ]
          .join(' ')
          .trim()}
        data-testid="admin-mobile-drawer-content">
        <div
          className={[
            mobileDrawerDialogClass,
            isOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none',
          ]
            .join(' ')
            .trim()}
          data-testid="admin-mobile-drawer-dialog"
          role="dialog">
          <header className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">后台导航</h2>
            <Button
              aria-label="关闭导航菜单"
              className={mobileDrawerCloseButtonClass}
              isIconOnly
              onPress={() => onOpenChange(false)}
              type="button"
              variant="ghost">
              <span aria-hidden="true">×</span>
            </Button>
          </header>
          <div className="space-y-5">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
              <p className="text-sm font-semibold">{currentUser.username}</p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {currentUser.role} · 快捷切换后台工作区
              </p>
            </div>
            <AdminNavItems
              currentPathname={currentPathname}
              locale={locale}
              onNavigate={() => {
                onNavigate()
                onOpenChange(false)
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
