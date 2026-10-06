'use client'

import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons'
import { Breadcrumb, Button, Layout, Space } from 'antd'
import { usePathname } from 'next/navigation'

import { adminNavigation } from '@config/admin-navigation'
import { findNavigationTrail } from '@/utils/navigation'

import { AdminUserMenu } from './admin-user-menu'
import { ThemeToggle } from './theme-toggle'

const { Header } = Layout

export function AdminHeader({
  collapsed,
  onToggle,
}: {
  collapsed: boolean
  onToggle: () => void
}) {
  const pathname = usePathname()
  const trail = findNavigationTrail(adminNavigation, pathname)
  const title = trail.at(-1)?.label ?? '概览'

  return (
    <Header className="flex items-center justify-between px-4">
      <Space size="middle" align="center">
        <Button
          type="text"
          aria-label={collapsed ? '展开侧边栏' : '收起侧边栏'}
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={onToggle}
        />
        <div className="leading-tight">
          {trail.length > 1 && (
            <Breadcrumb
              className="text-xs"
              items={trail.map(item => ({ title: item.label }))}
            />
          )}
          <div className="text-base font-semibold">{title}</div>
        </div>
      </Space>
      <Space size="middle" align="center">
        <ThemeToggle />
        <AdminUserMenu />
      </Space>
    </Header>
  )
}
