'use client'

import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons'
import { Avatar, Button, Layout, Space } from 'antd'

const { Header } = Layout

export function AdminHeader({
  collapsed,
  onToggle,
}: {
  collapsed: boolean
  onToggle: () => void
}) {
  return (
    <Header className="flex items-center justify-between px-4 shadow-sm">
      <Button
        type="text"
        aria-label={collapsed ? '展开侧边栏' : '收起侧边栏'}
        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        onClick={onToggle}
      />
      <Space size="middle">
        <Avatar size="small" style={{ backgroundColor: '#7c3aed' }}>
          R
        </Avatar>
      </Space>
    </Header>
  )
}
