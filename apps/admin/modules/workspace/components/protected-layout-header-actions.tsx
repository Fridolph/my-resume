'use client'

import { Avatar } from '@heroui/react/avatar'
import { Button } from '@heroui/react/button'
import { Dropdown } from '@heroui/react/dropdown'
import { Tooltip } from '@heroui/react/tooltip'
import type { ComponentType } from 'react'

import type { AuthUserView } from '../../auth/types/auth.types'
import {
  headerActionsClass,
  headerAvatarButtonClass,
  headerAvatarClass,
  headerIconButtonClass,
  sessionDropdownItemContentClass,
  sessionDropdownItemLabelClass,
  sessionDropdownItemValueClass,
  sessionDropdownMenuClass,
  sessionDropdownPopoverClass,
} from './protected-layout.constants'
import { GithubIcon } from './protected-layout-icons'

interface AdminHeaderActionsProps {
  currentUser: AuthUserView
  onLogout: () => void
  ThemeModeToggle: ComponentType
}

export function AdminHeaderActions({
  currentUser,
  onLogout,
  ThemeModeToggle,
}: AdminHeaderActionsProps) {
  return (
    <div className={headerActionsClass}>
      <Tooltip>
        <Tooltip.Trigger>
          <Button
            aria-label="打开项目 GitHub 仓库"
            className={headerIconButtonClass}
            isIconOnly
            onClick={() => {
              window.open(
                'https://github.com/Fridolph/my-resume',
                '_blank',
                'noopener,noreferrer',
              )
            }}
            size="sm"
            type="button"
            variant="ghost">
            <GithubIcon />
          </Button>
        </Tooltip.Trigger>
        <Tooltip.Content offset={10} placement="bottom">
          GitHub 仓库
        </Tooltip.Content>
      </Tooltip>
      <ThemeModeToggle />
      <Dropdown>
        <Dropdown.Trigger aria-label="打开当前会话菜单" className={headerAvatarButtonClass}>
          <Avatar.Root aria-hidden="true" className={headerAvatarClass} size="sm">
            <Avatar.Fallback>
              {currentUser.username.slice(0, 1).toUpperCase()}
            </Avatar.Fallback>
          </Avatar.Root>
        </Dropdown.Trigger>
        <Dropdown.Popover className={sessionDropdownPopoverClass} placement="bottom end">
          <Dropdown.Menu
            aria-label="当前会话菜单"
            className={sessionDropdownMenuClass}
            onAction={(key) => {
              if (key === 'logout') {
                onLogout()
              }
            }}>
            <Dropdown.Item
              id="session-user"
              isDisabled
              textValue={`账号：${currentUser.username}`}>
              <div className={sessionDropdownItemContentClass}>
                <span className={sessionDropdownItemLabelClass}>账号</span>
                <span className={sessionDropdownItemValueClass}>{currentUser.username}</span>
              </div>
            </Dropdown.Item>
            <Dropdown.Item id="session-role" isDisabled textValue={`角色：${currentUser.role}`}>
              <div className={sessionDropdownItemContentClass}>
                <span className={sessionDropdownItemLabelClass}>角色</span>
                <span className={sessionDropdownItemValueClass}>{currentUser.role}</span>
              </div>
            </Dropdown.Item>
            <Dropdown.Item id="logout" textValue="退出登录">
              <div className={sessionDropdownItemContentClass}>
                <span className={sessionDropdownItemLabelClass}>操作</span>
                <span className={sessionDropdownItemValueClass}>退出登录</span>
              </div>
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    </div>
  )
}
