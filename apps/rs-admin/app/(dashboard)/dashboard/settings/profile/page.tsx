'use client'

import { Button, Card, Form, Input } from 'antd'

import { PageHeader } from '@shared/components/common/page-header'

export default function SettingsProfilePage() {
  return (
    <div className="space-y-4">
      <PageHeader title="用户信息" description="账号基础信息与联系方式（演示数据）" />
      <Card>
        <Form
          layout="vertical"
          style={{ maxWidth: 480 }}
          initialValues={{
            username: 'admin',
            email: 'admin@my-resume.dev',
            bio: 'JS 全栈开发者，关注工程化与 AI 应用。',
          }}
        >
          <Form.Item name="username" label="用户名">
            <Input />
          </Form.Item>
          <Form.Item name="email" label="邮箱">
            <Input />
          </Form.Item>
          <Form.Item name="bio" label="个人简介">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Button type="primary">保存</Button>
        </Form>
      </Card>
    </div>
  )
}
