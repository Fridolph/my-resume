'use client'

import { Button } from '@heroui/react/button'
import { useEffect, useRef, useState } from 'react'

import type { AuthUserView } from '../../auth/types/auth.types'
import { ThemeModeToggle } from '../../shared/components/theme-mode-toggle'
import {
  headerActionsClass,
  headerIconButtonClass,
  headerAvatarButtonClass,
  headerAvatarClass,
  sessionDropdownItemContentClass,
  sessionDropdownItemLabelClass,
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
        onClick={() => {
          window.open('https://github.com/Fridolph/my-resume', '_blank', 'noopener,noreferrer')
        }}
        size="sm"
        type="button"
        variant="ghost">
        <GithubIcon />
      </Button>
      <ThemeModeToggle />
      <div className="relative" ref={menuRef}>
        <button
          aria-expanded={menuOpen}
          aria-label="打开当前会话菜单"
          className={headerAvatarButtonClass}
          onClick={() => setMenuOpen((current) => !current)}
          type="button">
          <span aria-hidden="true" className={headerAvatarClass}>
            {currentUser.username.slice(0, 1).toUpperCase()}
          </span>
        </button>
        <div
          aria-label="当前会话菜单"
          className={[
            'absolute right-0 top-[calc(100%+0.4rem)] z-30 min-w-[220px] rounded-2xl border border-zinc-200/80 bg-white/96 p-[0.35rem] shadow-xl transition duration-150 dark:border-zinc-800 dark:bg-zinc-950/95',
            menuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
          ]
            .join(' ')
            .trim()}>
          <div className={sessionDropdownItemContentClass}>
            <span className={sessionDropdownItemLabelClass}>账号</span>
            <span className={sessionDropdownItemValueClass}>{currentUser.username}</span>
          </div>
          <div className={[sessionDropdownItemContentClass, 'mt-3'].join(' ').trim()}>
            <span className={sessionDropdownItemLabelClass}>角色</span>
            <span className={sessionDropdownItemValueClass}>{currentUser.role}</span>
          </div>
          <button
            className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-zinc-200/80 px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-800/80"
            onClick={() => {
              setMenuOpen(false)
              onLogout()
            }}
            type="button">
            退出登录
          </button>
        </div>
      </div>
    </div>
  )
}
