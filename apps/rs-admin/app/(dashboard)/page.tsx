'use client'

import { Card, Col, List, Row, Statistic } from 'antd'

import { mockOverviewStats, mockRecentActivities } from '@shared/lib/mock/mock-data'

export default function DashboardPage() {
  return (
    <div className="space-y-4">

      <Row gutter={[16, 16]}>
        {mockOverviewStats.map(item => (
          <Col key={item.key} xs={24} sm={12} lg={8}>
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
              dataSource={mockRecentActivities}
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
