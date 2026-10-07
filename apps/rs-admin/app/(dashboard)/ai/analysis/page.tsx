'use client'

import { Card, Table, Tag } from 'antd'
import type { TableColumnsType } from 'antd'

import { mockAiAnalysisJobs, type AiJobItem } from '@shared/lib/mock/mock-data'

const statusTag: Record<AiJobItem['status'], { color: string; text: string }> = {
  success: { color: 'green', text: '成功' },
  running: { color: 'blue', text: '进行中' },
  failed: { color: 'red', text: '失败' },
}

const columns: TableColumnsType<AiJobItem> = [
  { title: '任务', dataIndex: 'name', key: 'name' },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    render: (status: AiJobItem['status']) => {
      const tag = statusTag[status]
      return <Tag color={tag.color}>{tag.text}</Tag>
    },
  },
  { title: '更新时间', dataIndex: 'updatedAt', key: 'updatedAt' },
]

export default function AiAnalysisPage() {
  return (
    <div className="space-y-4">
      <Card title="分析任务">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={mockAiAnalysisJobs}
          pagination={false}
        />
      </Card>
    </div>
  )
}
