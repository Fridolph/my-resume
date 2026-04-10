'use client'

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

import {
  mobileDrawerBackdropClass,
  mobileDrawerCloseButtonClass,
  mobileDrawerContentClass,
  mobileDrawerDialogClass,
} from './protected-layout.constants'
import { AdminNavItems } from './protected-layout-nav'

export function AdminMobileDrawer({
  currentPathname,
  currentUser,
  isOpen,
  onNavigate,
  onOpenChange,
}: {
  currentPathname: string
  currentUser: {
    username: string
    role: string
  }
  isOpen: boolean
  onNavigate: () => void
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Drawer
      data-testid="admin-mobile-drawer-root"
      isOpen={isOpen}
      key={currentPathname}
      onOpenChange={onOpenChange}>
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
            <DrawerCloseTrigger aria-label="关闭导航菜单" className={mobileDrawerCloseButtonClass}>
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
            <AdminNavItems currentPathname={currentPathname} onNavigate={onNavigate} />
          </DrawerBody>
        </DrawerDialog>
      </DrawerContent>
    </Drawer>
  )
}
