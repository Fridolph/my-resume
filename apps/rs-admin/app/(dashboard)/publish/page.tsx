'use client'

import { Card, Table, Tag } from 'antd'
import type { TableColumnsType } from 'antd'

import { mockPublishRecords, type PublishRecordItem } from '@shared/lib/mock/mock-data'

const statusTag: Record<
  PublishRecordItem['status'],
  { color: string; text: string }
> = {
  published: { color: 'green', text: '已发布' },
  pending: { color: 'gold', text: '待发布' },
  rolled_back: { color: 'red', text: '已回滚' },
}

const columns: TableColumnsType<PublishRecordItem> = [
  { title: '版本', dataIndex: 'version', key: 'version' },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    render: (status: PublishRecordItem['status']) => {
      const tag = statusTag[status]
      return <Tag color={tag.color}>{tag.text}</Tag>
    },
  },
  { title: '发布时间', dataIndex: 'publishedAt', key: 'publishedAt' },
]

export default function PublishPage() {
  return (
    <div className="space-y-4">
      <Card title="发布记录">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={mockPublishRecords}
          pagination={false}
        />
      </Card>
    </div>
  )
}
