'use client'

import { Drawer } from '@heroui/react'
import type { ReactNode } from 'react'

interface AdminDrawerShellProps {
  children: ReactNode
  dialogClassName?: string
  isDismissable?: boolean
  isOpen: boolean
  onClose: () => void
  placement?: 'bottom' | 'left' | 'right' | 'top'
}

export function AdminDrawerShell({
  children,
  dialogClassName,
  isDismissable = true,
  isOpen,
  onClose,
  placement = 'right',
}: AdminDrawerShellProps) {
  return (
    <Drawer.Backdrop
      isDismissable={isDismissable}
      isOpen={isOpen}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose()
        }
      }}>
      <Drawer.Content placement={placement}>
        <Drawer.Dialog className={dialogClassName}>{children}</Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  )
}
