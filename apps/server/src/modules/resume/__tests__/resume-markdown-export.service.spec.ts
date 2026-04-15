import { describe, expect, it } from 'vitest'

import { createExampleStandardResume } from '../domain/standard-resume'
import { ResumeMarkdownExportService } from '../resume-markdown-export.service'

describe('ResumeMarkdownExportService', () => {
  const service = new ResumeMarkdownExportService()

  it('should render a published resume as chinese markdown by default', () => {
    const resume = createExampleStandardResume()

    const markdown = service.render(resume, 'zh')

    expect(markdown).toContain('# 付寅生')
    expect(markdown).not.toContain('# 付寅生 -')
    expect(markdown).toContain('## 基本信息')
    expect(markdown).toContain('| 姓名 | 学历 | 工作年限 | 方向 | 地点 |')
    expect(markdown).toContain('Email: 249121486@qq.com  |  Phone: 16602835945')
    expect(markdown).not.toContain('在线简历:')
    expect(markdown).not.toContain('GitHub:')
    expect(markdown).not.toContain('技术博客:')
    expect(markdown).not.toContain('掘金:')
    expect(markdown).toContain('## 核心竞争力')
    expect(markdown).toContain('- **10 年全栈业务经验**：')
    expect(markdown).toContain('## 教育经历')
    expect(markdown).toContain('  ### **四川大学锦江学院**')
    expect(markdown).toContain('    2012-09 - 2016-06  全日制本科 / 学士 / 通信工程')
    expect(markdown).not.toContain('**学历：**')
    expect(markdown).toContain('## 专业技能')
    expect(markdown).toContain('### 前端核心能力')
    expect(markdown).not.toContain('前端核心能力 (95/100)')
    expect(markdown).toContain('**职位与类型：** 前端开发工程师 · 全职 · 成都')
    expect(markdown).toContain('## 核心项目经历')
    expect(markdown).toContain('  ### **GreenSketch** （2024-09 - 至今）')
    expect(markdown).toContain('**项目核心功能：** 覆盖项目设计、报价生成、收益测算')
    expect(markdown).toContain('**技术栈：** Nuxt 4 / Vue 3 / TypeScript')
  })

  it('should render english markdown when locale is en', () => {
    const resume = createExampleStandardResume()

    const markdown = service.render(resume, 'en')

    expect(markdown).toContain('# Yinsheng Fu')
    expect(markdown).not.toContain('# Yinsheng Fu -')
    expect(markdown).toContain('## Basic Information')
    expect(markdown).toContain('| Name | Education | Years | Focus | Location |')
    expect(markdown).toContain('Email: 249121486@qq.com  |  Phone: 16602835945')
    expect(markdown).not.toContain('Portfolio:')
    expect(markdown).not.toContain('GitHub:')
    expect(markdown).not.toContain('Tech Blog:')
    expect(markdown).not.toContain('Juejin:')
    expect(markdown).toContain('## Core Strengths')
    expect(markdown).toContain('- **10 Years of Product Delivery**: ')
    expect(markdown).toContain('## Education')
    expect(markdown).toContain('  ### **Sichuan University Jinjiang College**')
    expect(markdown).toContain('    2012-09 - 2016-06  Bachelor / Communication Engineering')
    expect(markdown).toContain('## Professional Skills')
    expect(markdown).toContain('### Frontend Core')
    expect(markdown).not.toContain('Frontend Core (95/100)')
    expect(markdown).toContain('**Role & Type:** Frontend Engineer · Full-time · Chengdu')
    expect(markdown).toContain('## Key Projects')
    expect(markdown).toContain('  ### **GreenSketch** (2024-09 - Present)')
    expect(markdown).toContain(
      '**Core Functions:** Covers project design, quotation generation, revenue forecasting',
    )
    expect(markdown).toContain('**Highlights, Challenges & Solutions:**')
    expect(markdown).toContain('AI Agent workflows')
  })

  it('should hide skill proficiency from markdown export', () => {
    const resume = createExampleStandardResume()
    resume.skills = [
      {
        name: {
          zh: '前端核心能力',
          en: 'Frontend Core',
        },
        keywords: ['Vue 3', 'Next.js', 'TypeScript'],
        proficiency: 95,
      },
    ]

    const markdown = service.render(resume, 'zh')

    expect(markdown).toContain('### 前端核心能力')
    expect(markdown).not.toContain('95/100')
    expect(markdown).toContain('- Vue 3')
    expect(markdown).toContain('- Next.js')
    expect(markdown).toContain('- TypeScript')
  })
})
