'use client'

import { Card, Timeline } from 'antd'


const releases = [
  { version: 'v3.0.0', date: '2025-01-12', changes: ['rs-admin 后台骨架重构', '本地 mock 模式'] },
  { version: 'v2.6.0', date: '2025-01-05', changes: ['新增 RAG 检索', '简历多版本'] },
  { version: 'v2.5.0', date: '2024-12-28', changes: ['发布流程优化'] },
]

export default function ChangelogPage() {
  return (
    <div className="space-y-4">
      <Card>
        <Timeline
          items={releases.map(item => ({
            key: item.version,
            children: (
              <div>
                <div className="font-medium">
                  {item.version}
                  <span className="ml-2 text-xs text-[var(--ant-color-text-secondary)]">
                    {item.date}
                  </span>
                </div>
                <ul className="mt-1 list-inside list-disc text-sm text-[var(--ant-color-text-secondary)]">
                  {item.changes.map(change => (
                    <li key={change}>{change}</li>
                  ))}
                </ul>
              </div>
            ),
          }))}
        />
      </Card>
    </div>
  )
}
