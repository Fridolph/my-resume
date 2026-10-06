'use client'

import { Card, Col, List, Row, Statistic } from 'antd'

import { PageHeader } from '@shared/components/common/page-header'

const summary = [
  { label: '简历版本', value: 12, suffix: '个' },
  { label: 'RAG 知识条目', value: 86, suffix: '条' },
  { label: 'AI 对话轮次', value: 59, suffix: '轮' },
]

const activities = [
  { title: '发布简历 v2.6.0', time: '12 分钟前' },
  { title: '重建 RAG 索引', time: '1 小时前' },
  { title: '更新 user_docs', time: '3 小时前' },
]

export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="概览" description="my-resume 后台总览" />

      <Row gutter={[16, 16]}>
        {summary.map(item => (
          <Col key={item.label} xs={24} sm={12} lg={8}>
            <Card>
              <Statistic title={item.label} value={item.value} suffix={item.suffix} />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="工作区">
            <div className="grid min-h-48 place-items-center text-sm text-[var(--ant-color-text-secondary)]">
              占位：后续接入核心模块（图表 / 表格 / 主工作流）
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="最近活动">
            <List
              dataSource={activities}
              renderItem={item => (
                <List.Item>
                  <div>
                    <div className="font-medium">{item.title}</div>
                    <div className="text-xs text-[var(--ant-color-text-secondary)]">
                      {item.time}
                    </div>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
