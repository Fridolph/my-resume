'use client'

import { DownOutlined, LogoutOutlined, UserOutlined } from '@ant-design/icons'
import { Avatar, Dropdown, Space } from 'antd'
import type { MenuProps } from 'antd'
import { useRouter } from 'next/navigation'

import { useAuth } from '@shared/lib/auth/auth-context'

export function AdminUserMenu() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const items: MenuProps['items'] = [
    {
      key: 'account',
      icon: <UserOutlined />,
      label: user?.username ?? '未登录',
      disabled: true,
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
    },
  ]

  const onClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'logout') {
      logout()
      router.replace('/login')
    }
  }

  const initial = (user?.username ?? 'U').slice(0, 1).toUpperCase()

  return (
    <Dropdown menu={{ items, onClick }} trigger={['click']}>
      <Space className="cursor-pointer">
        <Avatar size="small" style={{ backgroundColor: '#7c3aed' }}>
          {initial}
        </Avatar>
        <span className="hidden sm:inline">{user?.username ?? '未登录'}</span>
        <DownOutlined className="text-xs" />
      </Space>
    </Dropdown>
  )
}
