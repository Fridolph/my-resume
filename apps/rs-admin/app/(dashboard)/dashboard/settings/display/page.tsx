'use client'

import { Button, Card, Form, Radio, Select, Switch } from 'antd'

import { PageHeader } from '@shared/components/common/page-header'

export default function SettingsDisplayPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="展示配置" description="主题、语言与列表偏好（演示数据）" />
      <Card>
        <Form layout="vertical" style={{ maxWidth: 480 }} initialValues={{ theme: 'system', pageSize: 10 }}>
          <Form.Item name="theme" label="主题">
            <Radio.Group
              options={[
                { value: 'light', label: '亮色' },
                { value: 'dark', label: '暗色' },
                { value: 'system', label: '跟随系统' },
              ]}
            />
          </Form.Item>
          <Form.Item name="pageSize" label="每页条数">
            <Select
              options={[
                { value: 10, label: '10' },
                { value: 20, label: '20' },
                { value: 50, label: '50' },
              ]}
            />
          </Form.Item>
          <Form.Item name="compact" label="紧凑模式" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Button type="primary">保存</Button>
        </Form>
      </Card>
    </div>
  )
}
