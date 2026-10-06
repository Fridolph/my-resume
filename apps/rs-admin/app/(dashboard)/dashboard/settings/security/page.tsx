'use client'

import { Button, Card, Form, Input, Switch } from 'antd'

import { PageHeader } from '@shared/components/common/page-header'

export default function SettingsSecurityPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="安全配置" description="密码与会话安全（演示数据）" />
      <Card title="修改密码">
        <Form layout="vertical" style={{ maxWidth: 480 }}>
          <Form.Item name="current" label="当前密码">
            <Input.Password />
          </Form.Item>
          <Form.Item name="next" label="新密码">
            <Input.Password />
          </Form.Item>
          <Button type="primary">更新密码</Button>
        </Form>
      </Card>
      <Card title="会话">
        <div className="flex items-center justify-between py-2">
          <span className="text-sm">两步验证</span>
          <Switch />
        </div>
        <div className="flex items-center justify-between py-2">
          <span className="text-sm">30 分钟无操作自动登出</span>
          <Switch defaultChecked />
        </div>
      </Card>
    </div>
  )
}
