'use client'

import { Avatar, Card, List } from 'antd'

import { PageHeader } from '@shared/components/common/page-header'

interface ChatTurn {
  id: string
  role: 'user' | 'assistant'
  content: string
  time: string
}

const turns: ChatTurn[] = [
  { id: 'c1', role: 'user', content: '帮我总结一下最近的项目经历。', time: '10:24' },
  { id: 'c2', role: 'assistant', content: '可以，你主要有 5 个项目……', time: '10:24' },
  { id: 'c3', role: 'user', content: '语气再正式一点。', time: '10:26' },
  { id: 'c4', role: 'assistant', content: '已调整措辞，更偏正式描述。', time: '10:26' },
]

export default function AiChatPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="对话记录" description="简历助手历史对话（演示数据）" />
      <Card>
        <List
          itemLayout="horizontal"
          dataSource={turns}
          renderItem={item => (
            <List.Item>
              <List.Item.Meta
                avatar={
                  <Avatar style={{ backgroundColor: item.role === 'user' ? '#7c3aed' : '#1677ff' }}>
                    {item.role === 'user' ? '我' : 'AI'}
                  </Avatar>
                }
                title={item.role === 'user' ? '你' : '简历助手'}
                description={item.content}
              />
              <span className="text-xs text-[var(--ant-color-text-secondary)]">{item.time}</span>
            </List.Item>
          )}
        />
      </Card>
    </div>
  )
}
