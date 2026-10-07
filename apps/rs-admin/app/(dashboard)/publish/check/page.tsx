'use client'

import { Card, List, Tag } from 'antd'


interface CheckItem {
  id: string
  label: string
  passed: boolean
}

const checks: CheckItem[] = [
  { id: 'k1', label: '简历必填字段完整', passed: true },
  { id: 'k2', label: '无敏感信息泄露', passed: true },
  { id: 'k3', label: 'RAG 索引已同步', passed: false },
  { id: 'k4', label: '快照生成成功', passed: true },
]

export default function PublishCheckPage() {
  return (
    <div className="space-y-4">
      <Card>
        <List
          dataSource={checks}
          renderItem={item => (
            <List.Item
              extra={
                item.passed ? <Tag color="green">通过</Tag> : <Tag color="red">待处理</Tag>
              }
            >
              {item.label}
            </List.Item>
          )}
        />
      </Card>
    </div>
  )
}
