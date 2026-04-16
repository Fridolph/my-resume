'use client'

import { Button, Tooltip } from '@heroui/react'
import type { ReactNode } from 'react'

export const adminActionIconTriggerClassName = [
  'inline-flex h-8 w-8 min-w-8 items-center justify-center rounded-full p-0 text-zinc-500',
  'transition-colors focus-visible:ring-2 focus-visible:ring-blue-500/20',
  'data-[hovered=true]:text-zinc-900',
  'data-[pressed=true]:scale-100',
  'dark:text-zinc-300',
  'dark:data-[hovered=true]:text-white',
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
