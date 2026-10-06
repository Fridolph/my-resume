'use client'

import { Layout } from 'antd'
import { useState, type ReactNode } from 'react'

import { AdminHeader } from './admin-header'
import { AdminSidebar } from './admin-sidebar'
import { PageContainer } from './page-container'

const { Content } = Layout

/**
 * 后台布局：结构对齐 dao-monorepo-temp。
 *  - 左：固定侧栏（sticky，视口高）
 *  - 右：吸顶 Header + 可滚动主内容区
 */
export function AdminLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <Layout hasSider className="min-h-screen">
      <AdminSidebar collapsed={collapsed} onToggleCollapsed={() => setCollapsed(v => !v)} />
      <Layout className="min-w-0">
        <AdminHeader />
        <Content className="p-4 md:p-6">
          <PageContainer>{children}</PageContainer>
        </Content>
      </Layout>
    </Layout>
  )
}
