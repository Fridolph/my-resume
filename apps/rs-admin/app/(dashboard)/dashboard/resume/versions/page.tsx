'use client'

import { Card, Table, Tag } from 'antd'
import type { TableColumnsType } from 'antd'

import { PageHeader } from '@shared/components/common/page-header'

interface ResumeVersion {
  id: string
  version: string
  editor: string
  createdAt: string
  isCurrent: boolean
}

const versions: ResumeVersion[] = [
  { id: 'v1', version: 'v2.6.0', editor: 'admin', createdAt: '2025-01-12 10:24', isCurrent: true },
  { id: 'v2', version: 'v2.5.1', editor: 'admin', createdAt: '2025-01-05 09:10', isCurrent: false },
  { id: 'v3', version: 'v2.5.0', editor: 'test', createdAt: '2024-12-28 20:41', isCurrent: false },
]

const columns: TableColumnsType<ResumeVersion> = [
  {
    title: '版本',
    dataIndex: 'version',
    key: 'version',
    render: (version: string, record) => (
      <span>
        {version} {record.isCurrent ? <Tag color="green">当前</Tag> : null}
      </span>
    ),
  },
  { title: '编辑人', dataIndex: 'editor', key: 'editor' },
  { title: '时间', dataIndex: 'createdAt', key: 'createdAt' },
]

export default function ResumeVersionsPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="版本历史" description="简历历史版本与快照（演示数据）" />
      <Card>
        <Table rowKey="id" columns={columns} dataSource={versions} pagination={false} />
      </Card>
    </div>
  )
}
