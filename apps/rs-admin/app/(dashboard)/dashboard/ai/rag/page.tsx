'use client'

import { Card, List, Tag } from 'antd'

import { PageHeader } from '@shared/components/common/page-header'
import { mockRagDocuments } from '@shared/lib/mock/mock-data'

export default function AiRagPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="RAG 管理" description="管理补充知识库、检索与向量（演示数据）" />
      <Card title="知识文档">
        <List
          dataSource={mockRagDocuments}
          renderItem={item => (
            <List.Item
              extra={
                item.status === 'success' ? (
                  <Tag color="green">已入库</Tag>
                ) : (
                  <Tag color="blue">处理中</Tag>
                )
              }
            >
              <List.Item.Meta
                title={item.name}
                description={`更新时间：${item.updatedAt}`}
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  )
}
