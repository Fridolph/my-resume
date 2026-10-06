'use client'

import { Button, Card, Space, Tag } from 'antd'

/**
 * 脚手架占位首页：验证 antd 组件 + Tailwind 布局同时生效。
 * 后续由 M49-I5（布局壳）替换为真实 Dashboard。
 */
export default function HomePage() {
  return (
    <main className="grid min-h-screen place-items-center bg-gray-50 p-8">
      <Card title="rs-admin 脚手架已就绪" className="w-full max-w-xl">
        <Space direction="vertical" size="middle" className="w-full">
          <div className="flex flex-wrap items-center gap-2">
            <Tag color="processing">ant-design v5</Tag>
            <Tag color="success">Tailwind v4</Tag>
            <Tag color="purple">Next.js 15</Tag>
          </div>
          <Space>
            <Button type="primary">主按钮</Button>
            <Button>次按钮</Button>
          </Space>
        </Space>
      </Card>
    </main>
  )
}
