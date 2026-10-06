'use client'

import { Card, Col, List, Row } from 'antd'

import { PageHeader } from '@shared/components/common/page-header'

const topics = [
  { id: 't1', title: '如何编辑简历草稿', description: '从简历管理进入编辑，保存后生成新版本' },
  { id: 't2', title: '如何补充知识库', description: '在 AI 工作台 → RAG 管理上传文档' },
  { id: 't3', title: '如何发布简历', description: '发布治理 → 发布检查通过后发布' },
]

export default function HelpPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="帮助中心" description="使用说明与常见问题（演示数据）" />
      <Row gutter={[16, 16]}>
        {topics.map(topic => (
          <Col key={topic.id} xs={24} md={12} xl={8}>
            <Card title={topic.title}>
              <p className="text-sm text-[var(--ant-color-text-secondary)]">{topic.description}</p>
            </Card>
          </Col>
        ))}
      </Row>
      <Card title="快捷链接">
        <List
          dataSource={['开发文档（docs/）', 'GitHub 仓库', '问题反馈']}
          renderItem={item => <List.Item>{item}</List.Item>}
        />
      </Card>
    </div>
  )
}
