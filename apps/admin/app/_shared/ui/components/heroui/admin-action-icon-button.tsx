'use client'

import { Button, Tooltip } from '@heroui/react'
import type { ReactNode } from 'react'

export const adminActionIconTriggerClassName = [
  'inline-flex h-8 w-8 min-w-8 items-center justify-center rounded-full border border-zinc-200/80 bg-zinc-50 p-0 text-zinc-500',
  'transition-none',
  'data-[hovered=true]:border-zinc-200/80 data-[hovered=true]:bg-zinc-50 data-[hovered=true]:text-zinc-500',
  'data-[pressed=true]:scale-100',
  'dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300',
  'dark:data-[hovered=true]:border-zinc-800 dark:data-[hovered=true]:bg-zinc-900 dark:data-[hovered=true]:text-zinc-300',
].join(' ')

interface AdminActionIconButtonProps {
  icon: ReactNode
  isDisabled?: boolean
  label: string
  onPress: () => void
}

export function AdminActionIconButton({
  icon,
  isDisabled,
  label,
  onPress,
}: AdminActionIconButtonProps) {
  return (
    <Tooltip delay={180}>
      <Tooltip.Trigger>
        <Button
          aria-label={label}
          className={adminActionIconTriggerClassName}
          isDisabled={isDisabled}
          isIconOnly
          onPress={onPress}
          size="sm"
          type="button"
          variant="ghost">
          {icon}
        </Button>
      </Tooltip.Trigger>
      <Tooltip.Content offset={10} placement="top">
        {label}
      </Tooltip.Content>
    </Tooltip>
  )
}
