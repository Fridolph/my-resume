import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import request from 'supertest'
import { App } from 'supertest/types'

import { AppModule } from '../src/app.module'

const source = `
profile:
  name: 付寅生
  title: 前端工程师
  location: 成都
  experienceYears: 8年
  targetRole: 前端 / 全职
  status: 已离职
  summary: 擅长 Vue3 与前端工程化
skills:
  - 熟悉 Vue3 与 TypeScript
strengths:
  - 从 0 到 1 搭建 OpenClaw 多 Agent 工作流
education:
  - id: scu
    school: 四川大学锦江学院
    degree: 本科
    major: 通信工程
    period: 2012 - 2016
    location: 四川成都
experiences:
  - id: wskp
    company: 成都网思科平科技有限公司
    role: 前端组长
    period: 2017 - 2024
    summary: 负责 ToB 安全平台前端架构
    projects:
      - id: edr
        name: EDR - 终端威胁侦测与响应平台
        summary: 安全平台
        contributions:
          - 完成终端侦测与响应平台相关开发
projects: []
`

const articleMarkdown = `---
title: 「JS全栈 AI Agent 学习」RAG篇①：先翻书，再答题——RAG 是什么？
date: 2026-03-23
---

RAG 是面向私有知识问答的常见方案。

## 一、RAG 是什么？

RAG = Retrieval-Augmented Generation，检索增强生成。
`

describe('AI RAG (e2e)', () => {
  const originalEnv = {
    AI_PROVIDER: process.env.AI_PROVIDER,
    RAG_RESUME_SOURCE_PATH: process.env.RAG_RESUME_SOURCE_PATH,
    RAG_BLOG_DIRECTORY_PATH: process.env.RAG_BLOG_DIRECTORY_PATH,
    RAG_INDEX_PATH: process.env.RAG_INDEX_PATH,
  }

  let app: INestApplication<App>
  let tempDirectory: string

  beforeEach(async () => {
    tempDirectory = mkdtempSync(join(tmpdir(), 'resume-rag-e2e-'))
    process.env.AI_PROVIDER = 'mock'
    process.env.RAG_RESUME_SOURCE_PATH = join(tempDirectory, 'resume.zh.yaml')
    process.env.RAG_BLOG_DIRECTORY_PATH = join(tempDirectory, 'blog')
    process.env.RAG_INDEX_PATH = join(tempDirectory, 'resume-index.json')
    writeFileSync(process.env.RAG_RESUME_SOURCE_PATH, source)
    mkdirSync(process.env.RAG_BLOG_DIRECTORY_PATH, { recursive: true })
    writeFileSync(join(process.env.RAG_BLOG_DIRECTORY_PATH, 'rag-1.md'), articleMarkdown)

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    await app.init()
  })

  afterEach(async () => {
    await app.close()
    process.env.AI_PROVIDER = originalEnv.AI_PROVIDER
    process.env.RAG_RESUME_SOURCE_PATH = originalEnv.RAG_RESUME_SOURCE_PATH
    process.env.RAG_BLOG_DIRECTORY_PATH = originalEnv.RAG_BLOG_DIRECTORY_PATH
    process.env.RAG_INDEX_PATH = originalEnv.RAG_INDEX_PATH
    rmSync(tempDirectory, { recursive: true, force: true })
  })

  it('should rebuild, search, and answer over the local resume rag source', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        username: 'admin',
        password: 'admin123456',
      })
      .expect(200)

    const accessToken = loginResponse.body.accessToken as string

    const rebuildResponse = await request(app.getHttpServer())
      .post('/ai/rag/index/rebuild')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201)

    expect(rebuildResponse.body.indexed).toBe(true)
    expect(rebuildResponse.body.stale).toBe(false)
    expect(rebuildResponse.body.chunkCount).toBeGreaterThan(0)
    expect(rebuildResponse.body.knowledgeChunkCount).toBeGreaterThan(0)
    expect(rebuildResponse.body.providerSummary.chatModel).toBe('mock-resume-advisor')
    expect(rebuildResponse.body.indexedProviderSummary.embeddingModel).toBe(
      'mock-resume-advisor-embedding',
    )

    const searchResponse = await request(app.getHttpServer())
      .post('/ai/rag/search')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        query: '他做过 EDR 相关项目吗',
        limit: 2,
      })
      .expect(201)

    expect(searchResponse.body[0].title).toContain('EDR')

    const askResponse = await request(app.getHttpServer())
      .post('/ai/rag/ask')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        question: '他有没有前端组长经验？',
        limit: 2,
      })
      .expect(201)

    expect(askResponse.body.answer).toContain('prompt=')
    expect(askResponse.body.matches.length).toBeGreaterThan(0)

    const knowledgeSearchResponse = await request(app.getHttpServer())
      .post('/ai/rag/search')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        query: 'RAG 是什么',
        limit: 2,
      })
      .expect(201)

    expect(knowledgeSearchResponse.body[0].section).toBe('knowledge')
    expect(knowledgeSearchResponse.body[0].title).toContain('RAG篇①')

    const strengthsSearchResponse = await request(app.getHttpServer())
      .post('/ai/rag/search')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        query: '他有 OpenClaw 多 Agent 工作流实践吗',
        limit: 5,
      })
      .expect(201)

    expect(
      strengthsSearchResponse.body.some(
        (item: { section: string; content: string }) =>
          item.section === 'strengths' && item.content.includes('OpenClaw'),
      ),
    ).toBe(true)

    writeFileSync(
      process.env.RAG_RESUME_SOURCE_PATH!,
      `${source}\nstrengths:\n  - 新增 stale 信号\n`,
    )

    const statusResponse = await request(app.getHttpServer())
      .get('/ai/rag/status')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)

    expect(statusResponse.body.indexed).toBe(true)
    expect(statusResponse.body.stale).toBe(true)
    expect(statusResponse.body.currentSourceHash).not.toBe(
      statusResponse.body.indexedSourceHash,
    )
  })
})
