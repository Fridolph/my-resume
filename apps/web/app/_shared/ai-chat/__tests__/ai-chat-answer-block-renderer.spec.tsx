import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AiChatAnswerBlockRenderer } from '../ai-chat-answer-block-renderer'

describe('AiChatAnswerBlockRenderer', () => {
  it('should render project and experience cards', () => {
    render(
      <AiChatAnswerBlockRenderer
        blocks={[
          {
            type: 'project_card',
            title: 'my-resume',
            subtitle: '个人项目',
            period: '2026',
            summary: '一个结合公开简历、AI 对话和 RAG 的全栈项目。',
            technologies: ['Next.js', 'NestJS', 'RAG'],
            highlights: ['接入流式回答', '支持引用解释'],
            url: 'https://example.com/project',
            imageUrl: 'https://example.com/project.png',
          },
          {
            type: 'experience_card',
            title: '全栈开发工程师',
            subtitle: '增长平台',
            period: '2021 - 2025',
            summary: '负责业务平台和工程化交付。',
            technologies: ['Vue', 'Node.js'],
            highlights: ['推进组件复用', '优化交付流程'],
          },
        ]}
        locale="zh"
      />,
    )

    expect(screen.getByText('项目')).toBeInTheDocument()
    expect(screen.getByText('my-resume')).toBeInTheDocument()
    expect(screen.getByText('Next.js')).toBeInTheDocument()
    expect(screen.getByText('接入流式回答')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'my-resume' })).toHaveAttribute(
      'src',
      'https://example.com/project.png',
    )
    expect(screen.getByRole('link', { name: '查看项目' })).toHaveAttribute(
      'href',
      'https://example.com/project',
    )
    expect(screen.getByText('经历')).toBeInTheDocument()
    expect(screen.getByText('全栈开发工程师')).toBeInTheDocument()
  })

  it('should render hobby, article, media, summary and notice blocks', () => {
    render(
      <AiChatAnswerBlockRenderer
        blocks={[
          {
            type: 'hobby_card',
            title: '羽毛球',
            description: '用运动调节节奏，也训练临场反应。',
            url: 'https://example.com/hobby',
            imageUrl: 'https://example.com/hobby.png',
            keywords: ['运动', '节奏感'],
            media: [
              {
                type: 'video',
                url: 'https://example.com/hobby-video',
                title: '训练片段',
                thumbnailUrl: 'https://example.com/hobby-thumb.png',
              },
            ],
          },
          {
            type: 'article_card',
            title: 'JS 全栈 AI Agent 学习',
            summary: '记录 RAG、Agent 与工程化实践。',
            url: 'https://example.com/article',
            imageUrl: 'https://example.com/article.png',
            publishedAt: '2026-05-01',
            keywords: ['Agent', 'LangGraph'],
            media: [
              {
                type: 'link',
                url: 'https://example.com/article-demo',
                title: '示例仓库',
              },
            ],
          },
          {
            type: 'media_card',
            title: '项目演示视频',
            description: '展示 AI Intro 的交互过程。',
            url: 'https://example.com/video',
            thumbnailUrl: 'https://example.com/thumb.png',
          },
          {
            type: 'summary',
            stage: 'turn-10',
            title: '阶段总结',
            summary: '访客主要关注项目经验和 AI 落地方式。',
            keywords: ['项目经验', 'AI 落地'],
          },
          {
            type: 'system_notice',
            tone: 'info',
            text: '这个回答只基于已检索到的简历上下文。',
          },
        ]}
        locale="zh"
      />,
    )

    expect(screen.getByText('兴趣')).toBeInTheDocument()
    expect(screen.getByText('羽毛球')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: '羽毛球' })).toHaveAttribute(
      'src',
      'https://example.com/hobby.png',
    )
    expect(screen.getByRole('link', { name: '查看链接' })).toHaveAttribute(
      'href',
      'https://example.com/hobby',
    )
    expect(screen.getByRole('link', { name: '训练片段' })).toHaveAttribute(
      'href',
      'https://example.com/hobby-video',
    )
    expect(screen.getByText('文章')).toBeInTheDocument()
    expect(screen.getByText('2026-05-01')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'JS 全栈 AI Agent 学习' })).toHaveAttribute(
      'src',
      'https://example.com/article.png',
    )
    expect(screen.getByRole('link', { name: '示例仓库' })).toHaveAttribute(
      'href',
      'https://example.com/article-demo',
    )
    expect(screen.getByRole('link', { name: '阅读文章' })).toHaveAttribute(
      'href',
      'https://example.com/article',
    )
    expect(screen.getByText('媒体')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '查看媒体' })).toHaveAttribute(
      'href',
      'https://example.com/video',
    )
    expect(screen.getByText('总结')).toBeInTheDocument()
    expect(screen.getByText('这个回答只基于已检索到的简历上下文。')).toBeInTheDocument()
  })

  it('should render nothing when no blocks are provided', () => {
    const { container } = render(<AiChatAnswerBlockRenderer blocks={[]} locale="zh" />)

    expect(container).toBeEmptyDOMElement()
  })
})
