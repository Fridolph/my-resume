'use client'

import { Card, Table, Tag } from 'antd'
import type { TableColumnsType } from 'antd'

import { mockResumeSections, type ResumeSectionPreview } from '@shared/lib/mock/mock-data'

const columns: TableColumnsType<ResumeSectionPreview> = [
  { title: '模块', dataIndex: 'title', key: 'title' },
  { title: '内容摘要', dataIndex: 'summary', key: 'summary' },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    render: status =>
      status === 'published' ? <Tag color="green">已发布</Tag> : <Tag color="gold">草稿</Tag>,
  },
]

export default function ResumePage() {
  return (
    <div className="space-y-4">
      <Card title="简历模块">
        <Table
          rowKey="key"
          columns={columns}
          dataSource={mockResumeSections}
          pagination={false}
        />
      </Card>
    </div>
  )
}
