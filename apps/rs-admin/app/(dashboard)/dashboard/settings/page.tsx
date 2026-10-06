'use client'

import { Card, Col, Row, Switch } from 'antd'

import { PageHeader } from '@shared/components/common/page-header'

const settingsGroups = [
  { key: 'account', title: '账号', description: '用户名、密码与安全设置' },
  { key: 'notify', title: '通知', description: '发布、AI 任务完成提醒' },
  { key: 'storage', title: '存储', description: '简历版本与快照保留策略' },
]

export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="设置" description="后台偏好与系统配置（演示数据）" />
      <Row gutter={[16, 16]}>
        {settingsGroups.map(group => (
          <Col key={group.key} xs={24} md={12} xl={8}>
            <Card title={group.title}>
              <p className="mb-4 text-sm text-[var(--ant-color-text-secondary)]">
                {group.description}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm">启用</span>
                <Switch defaultChecked={group.key === 'notify'} />
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  )
}
