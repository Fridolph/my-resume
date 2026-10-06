'use client'

import { Button, Card, Form, Input, InputNumber, Select, Switch } from 'antd'

import { PageHeader } from '@shared/components/common/page-header'

export default function SettingsAiPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="AI 设置" description="对话模型、检索与生成参数（演示数据）" />
      <Card>
        <Form
          layout="vertical"
          style={{ maxWidth: 560 }}
          initialValues={{ model: 'qwen-max', temperature: 0.7, rerank: true }}
        >
          <Form.Item name="model" label="对话模型">
            <Select
              options={[
                { value: 'qwen-max', label: 'qwen-max' },
                { value: 'qwen-plus', label: 'qwen-plus' },
                { value: 'qwen-turbo', label: 'qwen-turbo' },
              ]}
            />
          </Form.Item>
          <Form.Item name="temperature" label="Temperature">
            <InputNumber min={0} max={2} step={0.1} className="w-full" />
          </Form.Item>
          <Form.Item name="rerank" label="启用 Rerank（qwen3-rerank）" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="systemPrompt" label="系统提示词">
            <Input.TextArea rows={4} placeholder="你是一个简历助手……" />
          </Form.Item>
          <Button type="primary">保存</Button>
        </Form>
      </Card>
    </div>
  )
}
