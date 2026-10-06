'use client'

import { Layout } from 'antd'
import { useState, type ReactNode } from 'react'

import { AdminHeader } from './admin-header'
import { AdminSidebar } from './admin-sidebar'
import { PageContainer } from './page-container'

const { Content } = Layout

export function AdminLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <Layout className="min-h-screen">
      <AdminSidebar collapsed={collapsed} />
      <Layout>
        <AdminHeader collapsed={collapsed} onToggle={() => setCollapsed(v => !v)} />
        <Content className="p-4">
          <PageContainer>
            <div className="rounded-lg bg-[var(--ant-color-bg-container)] p-6 shadow-sm">
              {children}
            </div>
          </PageContainer>
        </Content>
      </Layout>
    </Layout>
  )
}
