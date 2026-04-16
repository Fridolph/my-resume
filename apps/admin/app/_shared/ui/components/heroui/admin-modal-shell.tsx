'use client'

import { Modal } from '@heroui/react'
import type { ReactNode } from 'react'

interface AdminModalShellProps {
  children: ReactNode
  containerClassName?: string
  dialogClassName?: string
  isDismissable?: boolean
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  placement?: 'auto' | 'bottom' | 'center' | 'top'
}

export function AdminModalShell({
  children,
  containerClassName,
  dialogClassName,
  isDismissable = true,
  isOpen,
  onOpenChange,
  placement = 'auto',
}: AdminModalShellProps) {
  return (
    <Modal.Backdrop
      isDismissable={isDismissable}
      isOpen={isOpen}
      onOpenChange={onOpenChange}>
      <Modal.Container className={containerClassName} placement={placement}>
        <Modal.Dialog className={dialogClassName}>{children}</Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  )
}
