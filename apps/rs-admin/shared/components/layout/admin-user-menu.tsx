'use client'

import { DownOutlined, LogoutOutlined, SettingOutlined, UserOutlined } from '@ant-design/icons'
import { Avatar, Dropdown } from 'antd'
import type { MenuProps } from 'antd'
import { useRouter } from 'next/navigation'

import { useAuth } from '@shared/lib/auth/auth-context'

interface AdminUserMenuProps {
  collapsed?: boolean
}

/**
 * 用户菜单：位于侧栏底部（对齐 dao 的 sidebar footer）。
 * 折叠时只显示头像，菜单向上/向右弹出。
 */
export function AdminUserMenu({ collapsed = false }: AdminUserMenuProps) {
  const { user, logout } = useAuth()
  const router = useRouter()

  const name = user?.username ?? '未登录'
  const email = user ? `${user.username}@my-resume.dev` : '—'

  const items: MenuProps['items'] = [
    {
      key: 'header',
      type: 'group',
      label: (
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-[var(--ant-color-text)]">{name}</span>
          <span className="text-xs text-[var(--ant-color-text-secondary)]">{email}</span>
        </div>
      ),
    },
    { type: 'divider' },
    { key: 'account', icon: <UserOutlined />, label: '我的账号' },
    { key: 'settings', icon: <SettingOutlined />, label: '设置' },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true },
  ]

  const onClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'logout') {
      logout()
      router.replace('/login')
    }
    if (key === 'settings') {
      router.push('/settings/profile')
    }
  }

  const initial = name.slice(0, 1).toUpperCase()

  return (
    <Dropdown menu={{ items, onClick }} trigger={['click']} placement="topLeft">
      <button
        type="button"
        className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-[var(--ant-color-fill-tertiary)]"
        aria-label="用户菜单"
      >
        <Avatar size="small" style={{ backgroundColor: '#7c3aed', flexShrink: 0 }}>
          {initial}
        </Avatar>
        {!collapsed ? (
          <>
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-sm font-medium text-[var(--ant-color-text)]">
                {name}
              </div>
              <div className="truncate text-xs text-[var(--ant-color-text-secondary)]">
                {email}
              </div>
            </div>
            <DownOutlined className="text-xs text-[var(--ant-color-text-secondary)]" />
          </>
        ) : null}
      </button>
    </Dropdown>
  )
}
