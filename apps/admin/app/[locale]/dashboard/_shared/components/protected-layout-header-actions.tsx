'use client'

import { Avatar } from '@heroui/react/avatar'
import { Button } from '@heroui/react/button'
import { useEffect, useRef, useState } from 'react'

import type { AuthUserView } from '../../../_auth/types/auth.types'
import { ThemeModeToggle } from '@shared/ui/components/theme-mode-toggle'
import {
  headerActionsClass,
  headerIconButtonClass,
  headerAvatarButtonClass,
  headerAvatarClass,
  headerAvatarFallbackClass,
  sessionDropdownLogoutButtonClass,
  sessionDropdownMenuClass,
  sessionDropdownItemContentClass,
  sessionDropdownItemLabelClass,
  sessionDropdownPopoverClass,
  sessionDropdownItemValueClass,
} from './protected-layout.constants'
import { GithubIcon } from './protected-layout-icons'

interface AdminHeaderActionsProps {
  currentUser: AuthUserView
  onLogout: () => void
}

export function AdminHeaderActions({ currentUser, onLogout }: AdminHeaderActionsProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!menuOpen) {
      return
    }

    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenuOpen(false)
      }
    }

    window.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('keydown', handleEscape)

    return () => {
      window.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('keydown', handleEscape)
    }
  }, [menuOpen])

  return (
    <div className={headerActionsClass}>
      <Button
        aria-label="打开项目 GitHub 仓库"
        className={headerIconButtonClass}
        isIconOnly
        onPress={() => {
          window.open('https://github.com/Fridolph/my-resume', '_blank', 'noopener,noreferrer')
        }}
        size="sm"
        type="button"
        variant="ghost">
        <GithubIcon />
      </Button>
      <ThemeModeToggle />
      <div className="relative" ref={menuRef}>
        <Button
          aria-expanded={menuOpen}
          aria-label="打开当前会话菜单"
          className={headerAvatarButtonClass}
          isIconOnly
          onPress={() => setMenuOpen((current) => !current)}
          type="button"
          variant="ghost">
          <Avatar.Root aria-hidden="true" className={headerAvatarClass}>
            <Avatar.Image
              alt={`${currentUser.username} avatar`}
              className="h-full w-full object-cover"
              src="/img/avatar.jpg"
            />
            <Avatar.Fallback className={headerAvatarFallbackClass}>
              {currentUser.username.slice(0, 1).toUpperCase()}
            </Avatar.Fallback>
          </Avatar.Root>
        </Button>
        <div
          aria-label="当前会话菜单"
          className={[
            sessionDropdownPopoverClass,
            menuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
          ]
            .join(' ')
            .trim()}>
          <div className={sessionDropdownMenuClass}>
            <div className={sessionDropdownItemContentClass}>
              <span className={sessionDropdownItemLabelClass}>账号</span>
              <span className={sessionDropdownItemValueClass}>{currentUser.username}</span>
            </div>
            <div className={sessionDropdownItemContentClass}>
              <span className={sessionDropdownItemLabelClass}>角色</span>
              <span className={sessionDropdownItemValueClass}>{currentUser.role}</span>
            </div>
            <Button
              className={sessionDropdownLogoutButtonClass}
              onPress={() => {
                setMenuOpen(false)
                onLogout()
              }}
              type="button"
              variant="danger">
              退出登录
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
