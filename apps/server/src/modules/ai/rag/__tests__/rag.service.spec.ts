import { mkdirSync, mkdtempSync, writeFileSync, rmSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AiService } from '../../ai.service'
import { createAiProvider } from '../../providers/ai-provider.factory'
import { RagChunkService } from '../rag-chunk.service'
import { RagIndexRepository } from '../rag-index.repository'
import { RagKnowledgeService } from '../rag-knowledge.service'
import { RagRetrievalRepository } from '../rag-retrieval.repository'
import { RagService } from '../rag.service'
import type { RagVectorStore } from '../vector-store/types'

function createMockRetrievalRepository() {
  return {
    listAllChunksWithDocuments: vi.fn().mockResolvedValue([]),
    listAllDocuments: vi.fn().mockResolvedValue([]),
  } as unknown as RagRetrievalRepository
}

const source = `
profile:
  name: 付寅生
  title: 前端工程师 / 前端负责人
  location: 成都
  experienceYears: 8年
  targetRole: 前端 / 全职
  status: 已离职
  summary: 擅长 Vue3、TypeScript、前端工程化
skills:
  - 熟悉 Vue3、TypeScript、NestJS
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
    summary: 负责 ToB 安全平台的前端架构与交付
    achievements:
      - 主导 EDR 与综合管理后台相关交付
    projects:
      - id: edr
        name: EDR - 终端威胁侦测与响应平台
        summary: 面向企业安全场景的终端威胁侦测平台
        contributions:
          - 通过 WebSocket 与大数据渲染优化终端详情页
projects:
  - id: resume
    name: my-resume 在线简历
    role: 作者 / 维护者
    period: 2024 - 至今
    summary: 在线简历项目
`

const articleMarkdown = `---
title: 「JS全栈 AI Agent 学习」RAG篇①：先翻书，再答题——RAG 是什么？
date: 2026-03-23
---

RAG 是面向私有知识问答的常见方案。

## 一、RAG 是什么？

RAG = Retrieval-Augmented Generation，检索增强生成。

## 二、为什么需要 RAG？

它的价值在于先检索知识，再生成答案，降低幻觉。
`

describe('RagService', () => {
  const originalEnv = {
    RAG_RESUME_SOURCE_PATH: process.env.RAG_RESUME_SOURCE_PATH,
    RAG_BLOG_DIRECTORY_PATH: process.env.RAG_BLOG_DIRECTORY_PATH,
    RAG_INDEX_PATH: process.env.RAG_INDEX_PATH,
    RAG_SEARCH_USE_VECTOR_STORE: process.env.RAG_SEARCH_USE_VECTOR_STORE,
    RAG_SEARCH_VECTOR_SCOPE: process.env.RAG_SEARCH_VECTOR_SCOPE,
    RAG_SEARCH_VECTOR_FALLBACK_TO_LOCAL: process.env.RAG_SEARCH_VECTOR_FALLBACK_TO_LOCAL,
  }

  let tempDirectory: string

  beforeEach(() => {
    tempDirectory = mkdtempSync(join(tmpdir(), 'resume-rag-'))
    const sourcePath = join(tempDirectory, 'resume.zh.yaml')
    const blogDirectoryPath = join(tempDirectory, 'blog')
    const indexPath = join(tempDirectory, 'resume-index.json')

    writeFileSync(sourcePath, source)
    mkdirSync(blogDirectoryPath, { recursive: true })
    writeFileSync(join(blogDirectoryPath, 'rag-1.md'), articleMarkdown)
    process.env.RAG_RESUME_SOURCE_PATH = sourcePath
    process.env.RAG_BLOG_DIRECTORY_PATH = blogDirectoryPath
    process.env.RAG_INDEX_PATH = indexPath
    delete process.env.RAG_SEARCH_USE_VECTOR_STORE
    delete process.env.RAG_SEARCH_VECTOR_SCOPE
    delete process.env.RAG_SEARCH_VECTOR_FALLBACK_TO_LOCAL
  })

  afterEach(() => {
    process.env.RAG_RESUME_SOURCE_PATH = originalEnv.RAG_RESUME_SOURCE_PATH
    process.env.RAG_BLOG_DIRECTORY_PATH = originalEnv.RAG_BLOG_DIRECTORY_PATH
    process.env.RAG_INDEX_PATH = originalEnv.RAG_INDEX_PATH
    process.env.RAG_SEARCH_USE_VECTOR_STORE = originalEnv.RAG_SEARCH_USE_VECTOR_STORE
    process.env.RAG_SEARCH_VECTOR_SCOPE = originalEnv.RAG_SEARCH_VECTOR_SCOPE
    process.env.RAG_SEARCH_VECTOR_FALLBACK_TO_LOCAL =
      originalEnv.RAG_SEARCH_VECTOR_FALLBACK_TO_LOCAL
    rmSync(tempDirectory, { recursive: true, force: true })
  })

  it('should rebuild local rag index and search the most relevant resume chunk', async () => {
    const aiService = new AiService(
      createAiProvider(
        {
          provider: 'mock',
          mode: 'mock',
          model: 'mock-resume-advisor',
        },
        vi.fn<typeof fetch>(),
      ),
    )
    const service = new RagService(
      aiService,
      new RagChunkService(),
      new RagKnowledgeService(),
      new RagIndexRepository(),
      createMockRetrievalRepository(),
      {
        backend: 'local',
        upsertChunks: vi.fn(),
        deleteChunksByDocument: vi.fn(),
        search: vi.fn().mockResolvedValue([]),
      } as unknown as RagVectorStore,
    )

    const status = await service.rebuildIndex()
    const matches = await service.search('他做过 EDR 安全平台吗', 3)

    expect(status.indexed).toBe(true)
    expect(status.stale).toBe(false)
    expect(status.chunkCount).toBeGreaterThan(0)
    expect(status.knowledgeChunkCount).toBeGreaterThan(0)
    expect(status.providerSummary.chatModel).toBe('mock-resume-advisor')
    expect(status.indexedProviderSummary?.embeddingModel).toBe('mock-resume-advisor')
    expect(
      matches.some((item) => item.title.includes('EDR') || item.content.includes('EDR')),
    ).toBe(true)
    expect(matches[0].score).toBeGreaterThan(0)
  })

  it('should mark the index as stale when the resume source changes after rebuild', async () => {
    const aiService = new AiService(
      createAiProvider(
        {
          provider: 'mock',
          mode: 'mock',
          model: 'mock-resume-advisor',
        },
        vi.fn<typeof fetch>(),
      ),
    )
    const service = new RagService(
      aiService,
      new RagChunkService(),
      new RagKnowledgeService(),
      new RagIndexRepository(),
      createMockRetrievalRepository(),
      {
        backend: 'local',
        upsertChunks: vi.fn(),
        deleteChunksByDocument: vi.fn(),
        search: vi.fn().mockResolvedValue([]),
      } as unknown as RagVectorStore,
    )

    await service.rebuildIndex()
    writeFileSync(
      process.env.RAG_RESUME_SOURCE_PATH!,
      `${source}\nstrengths:\n  - 新增 stale 信号\n`,
    )

    const status = service.getStatus()

    expect(status.indexed).toBe(true)
    expect(status.stale).toBe(true)
    expect(status.currentSourceHash).not.toBe(status.indexedSourceHash)
  })

  it('should mark the index as stale when the knowledge source changes after rebuild', async () => {
    const aiService = new AiService(
      createAiProvider(
        {
          provider: 'mock',
          mode: 'mock',
          model: 'mock-resume-advisor',
        },
        vi.fn<typeof fetch>(),
      ),
    )
    const service = new RagService(
      aiService,
      new RagChunkService(),
      new RagKnowledgeService(),
      new RagIndexRepository(),
      createMockRetrievalRepository(),
      {
        backend: 'local',
        upsertChunks: vi.fn(),
        deleteChunksByDocument: vi.fn(),
        search: vi.fn().mockResolvedValue([]),
      } as unknown as RagVectorStore,
    )

    await service.rebuildIndex()
    writeFileSync(
      join(process.env.RAG_BLOG_DIRECTORY_PATH!, 'rag-2.md'),
      `---\ntitle: 新文章\ndate: 2026-04-07\n---\n\n## 一、新增内容\n\n这是新的知识块。`,
    )

    const status = service.getStatus()

    expect(status.indexed).toBe(true)
    expect(status.stale).toBe(true)
    expect(status.currentKnowledgeHash).not.toBe(status.indexedKnowledgeHash)
  })

  it('should answer questions from retrieved resume context', async () => {
    const aiService = new AiService(
      createAiProvider(
        {
          provider: 'mock',
          mode: 'mock',
          model: 'mock-resume-advisor',
        },
        vi.fn<typeof fetch>(),
      ),
    )
    const service = new RagService(
      aiService,
      new RagChunkService(),
      new RagKnowledgeService(),
      new RagIndexRepository(),
      createMockRetrievalRepository(),
      {
        backend: 'local',
        upsertChunks: vi.fn(),
        deleteChunksByDocument: vi.fn(),
        search: vi.fn().mockResolvedValue([]),
      } as unknown as RagVectorStore,
    )

    const result = await service.ask(
      '他在成都网思科平科技有限公司是否担任过前端组长？',
      3,
      'zh',
    )

    expect(result.answer).toContain('prompt=')
    expect(result.citations.length).toBeGreaterThan(0)
    expect(result.citations[0]).toEqual(
      expect.objectContaining({
        ref: expect.stringMatching(/^#\d+$/),
        sourceType: expect.stringMatching(/^(resume_core|user_docs|knowledge)$/),
        score: expect.any(Number),
      }),
    )
    expect(result.matches.length).toBeGreaterThan(0)
    expect(
      result.matches.some(
        (item) =>
          item.content.includes('前端组长') ||
          item.content.includes('成都网思科平科技有限公司'),
      ),
    ).toBe(true)
  })

  it('should return an insufficient-context answer without calling the provider when no citation is available', async () => {
    const aiService = new AiService(
      createAiProvider(
        {
          provider: 'mock',
          mode: 'mock',
          model: 'mock-resume-advisor',
        },
        vi.fn<typeof fetch>(),
      ),
    )
    const service = new RagService(
      aiService,
      new RagChunkService(),
      new RagKnowledgeService(),
      new RagIndexRepository(),
      createMockRetrievalRepository(),
      {
        backend: 'local',
        upsertChunks: vi.fn(),
        deleteChunksByDocument: vi.fn(),
        search: vi.fn().mockResolvedValue([]),
      } as unknown as RagVectorStore,
    )
    const searchSpy = vi.spyOn(service, 'search').mockResolvedValue([])
    const generateSpy = vi.spyOn(aiService, 'generateText')

    const result = await service.ask('他是否获得过诺贝尔奖？', 3, 'zh')

    expect(searchSpy).toHaveBeenCalled()
    expect(generateSpy).not.toHaveBeenCalled()
    expect(result.answer).toContain('我的简历中暂时没有足够的信息')
    expect(result.citations).toEqual([])
    expect(result.matches).toEqual([])
  })

  it('should skip provider streaming when citations are below the accepted score threshold', async () => {
    const aiService = new AiService(
      createAiProvider(
        {
          provider: 'mock',
          mode: 'mock',
          model: 'mock-resume-advisor',
        },
        vi.fn<typeof fetch>(),
      ),
    )
    const service = new RagService(
      aiService,
      new RagChunkService(),
      new RagKnowledgeService(),
      new RagIndexRepository(),
      createMockRetrievalRepository(),
      {
        backend: 'local',
        upsertChunks: vi.fn(),
        deleteChunksByDocument: vi.fn(),
        search: vi.fn().mockResolvedValue([]),
      } as unknown as RagVectorStore,
    )
    const searchSpy = vi.spyOn(service, 'search').mockResolvedValue([
      {
        id: 'weak-user-doc:1',
        title: '弱相关补充资料',
        section: 'user_docs',
        content: '一段和问题弱相关的补充内容。',
        sourceType: 'user_docs',
        sourcePath: 'weak.md',
        score: 0.04,
      },
    ])
    const streamSpy = vi.spyOn(aiService, 'generateTextStream')
    const tokenSpy = vi.fn()

    const result = await service.ask(
      '随便聊点无关的东西',
      2,
      'zh',
      {},
      {
        minAcceptedCitationScore: 0.1,
        onToken: tokenSpy,
      },
    )

    expect(searchSpy).toHaveBeenCalled()
    expect(streamSpy).not.toHaveBeenCalled()
    expect(tokenSpy).not.toHaveBeenCalled()
    expect(result.answer).toBe('')
    expect(result.citations).toHaveLength(1)
    expect(result.citations[0]?.score).toBe(0.04)
  })

  it('should order ask citations by source priority before user docs', async () => {
    const aiService = new AiService(
      createAiProvider(
        {
          provider: 'mock',
          mode: 'mock',
          model: 'mock-resume-advisor',
        },
        vi.fn<typeof fetch>(),
      ),
    )
    const service = new RagService(
      aiService,
      new RagChunkService(),
      new RagKnowledgeService(),
      new RagIndexRepository(),
      createMockRetrievalRepository(),
      {
        backend: 'local',
        upsertChunks: vi.fn(),
        deleteChunksByDocument: vi.fn(),
        search: vi.fn().mockResolvedValue([]),
      } as unknown as RagVectorStore,
    )
    vi.spyOn(service, 'search').mockResolvedValue([
      {
        id: 'user-doc:1',
        title: '补充资料',
        section: 'user_docs',
        content: '用户资料中的补充说明',
        sourceType: 'user_docs',
        sourcePath: 'notes.md',
        score: 0.99,
      },
      {
        id: 'resume:1',
        title: '核心简历',
        section: 'experiences',
        content: '简历核心经历',
        sourceType: 'resume_core',
        score: 0.88,
      },
    ])

    const result = await service.ask('请总结经历', 2, 'zh')

    // 重排后按 rerankScore 降序：user_docs (0.99) > resume_core (0.88 + 0.08 = 0.96)
    expect(result.citations.map((item) => item.sourceType)).toEqual([
      'user_docs',
      'resume_core',
    ])
    expect(result.matches[0]?.id).toBe('user-doc:1')
  })

  it('should pass request-level routing override through ask to search', async () => {
    const aiService = new AiService(
      createAiProvider(
        {
          provider: 'mock',
          mode: 'mock',
          model: 'mock-resume-advisor',
        },
        vi.fn<typeof fetch>(),
      ),
    )
    const service = new RagService(
      aiService,
      new RagChunkService(),
      new RagKnowledgeService(),
      new RagIndexRepository(),
      createMockRetrievalRepository(),
      {
        backend: 'milvus',
        upsertChunks: vi.fn(),
        deleteChunksByDocument: vi.fn(),
        search: vi.fn().mockResolvedValue([]),
      } as unknown as RagVectorStore,
    )
    const searchSpy = vi.spyOn(service, 'search').mockResolvedValue([
      {
        id: 'user-doc-chunk:1',
        title: 'rag-notes.md',
        section: 'user_docs',
        content: 'Milvus ask routing test',
        sourceType: 'user_docs',
        sourcePath: 'rag-notes.md',
        score: 0.9,
      },
    ])

    await service.ask('Milvus ask', 2, 'zh', {
      useVectorStore: true,
      vectorScope: 'draft',
      fallbackToLocal: false,
    })

    expect(searchSpy).toHaveBeenCalledWith(
      'Milvus ask',
      2,
      expect.any(Object),
      {
        useVectorStore: true,
        vectorScope: 'draft',
        fallbackToLocal: false,
      },
    )
  })

  it('should index blog knowledge alongside the resume source', async () => {
    const aiService = new AiService(
      createAiProvider(
        {
          provider: 'mock',
          mode: 'mock',
          model: 'mock-resume-advisor',
        },
        vi.fn<typeof fetch>(),
      ),
    )
    const service = new RagService(
      aiService,
      new RagChunkService(),
      new RagKnowledgeService(),
      new RagIndexRepository(),
      createMockRetrievalRepository(),
      {
        backend: 'local',
        upsertChunks: vi.fn(),
        deleteChunksByDocument: vi.fn(),
        search: vi.fn().mockResolvedValue([]),
      } as unknown as RagVectorStore,
    )

    await service.rebuildIndex()
    const matches = await service.search('RAG 是什么', 4)

    // knowledge blog articles should appear in results
    const knowledgeMatch = matches.find((item) => item.section === 'knowledge')
    expect(knowledgeMatch).toBeDefined()
    expect(knowledgeMatch?.title).toContain('RAG篇①')
    expect(matches.some((item) => item.content.includes('检索增强生成') || item.content.includes('RAG'))).toBe(true)
  })

  it('should filter local search results by request knowledge domains', async () => {
    const aiService = new AiService(
      createAiProvider(
        {
          provider: 'mock',
          mode: 'mock',
          model: 'mock-resume-advisor',
        },
        vi.fn<typeof fetch>(),
      ),
    )
    const service = new RagService(
      aiService,
      new RagChunkService(),
      new RagKnowledgeService(),
      new RagIndexRepository(),
      createMockRetrievalRepository(),
      {
        backend: 'local',
        upsertChunks: vi.fn(),
        deleteChunksByDocument: vi.fn(),
        search: vi.fn().mockResolvedValue([]),
      } as unknown as RagVectorStore,
    )

    await service.rebuildIndex()
    const matches = await service.search('他做过 EDR 安全平台吗', 6, undefined, {
      knowledgeDomains: ['projects'],
    })

    expect(matches.length).toBeGreaterThan(0)
    expect(matches.some((item) => item.knowledgeDomain === 'projects')).toBe(true)
    expect(
      matches.every((item) =>
        item.knowledgeDomain === 'projects' || item.knowledgeDomain === 'resume_core'
      ),
    ).toBe(true)
  })

  it('should search newly added strengths from the latest resume source split', async () => {
    const aiService = new AiService(
      createAiProvider(
        {
          provider: 'mock',
          mode: 'mock',
          model: 'mock-resume-advisor',
        },
        vi.fn<typeof fetch>(),
      ),
    )
    const service = new RagService(
      aiService,
      new RagChunkService(),
      new RagKnowledgeService(),
      new RagIndexRepository(),
      createMockRetrievalRepository(),
      {
        backend: 'local',
        upsertChunks: vi.fn(),
        deleteChunksByDocument: vi.fn(),
        search: vi.fn().mockResolvedValue([]),
      } as unknown as RagVectorStore,
    )

    await service.rebuildIndex()
    const matches = await service.search('OpenClaw 工作流实践', 5)

    expect(
      matches.some(
        (item) => item.section === 'strengths' && item.content.includes('OpenClaw'),
      ),
    ).toBe(true)
  })

  it('should route search to vector store when the flag is enabled', async () => {
    process.env.RAG_SEARCH_USE_VECTOR_STORE = 'true'
    process.env.RAG_SEARCH_VECTOR_SCOPE = 'published'

    const aiService = new AiService(
      createAiProvider(
        {
          provider: 'mock',
          mode: 'mock',
          model: 'mock-resume-advisor',
        },
        vi.fn<typeof fetch>(),
      ),
    )
    const vectorSearch = vi.fn().mockResolvedValue([
      {
        id: 'user-doc-chunk:1',
        documentId: 'user-doc:1:und',
        sourceType: 'user_docs',
        sourceScope: 'published',
        sourceVersion: 'upload:1770000000000',
        section: 'user_docs',
        content: 'Milvus 检索命中',
        embedding: [],
        metadataJson: {
          fileName: 'rag-notes.md',
        },
        score: 0.91,
      },
    ])
    const service = new RagService(
      aiService,
      new RagChunkService(),
      new RagKnowledgeService(),
      new RagIndexRepository(),
      createMockRetrievalRepository(),
      {
        backend: 'milvus',
        upsertChunks: vi.fn(),
        deleteChunksByDocument: vi.fn(),
        search: vectorSearch,
      } as unknown as RagVectorStore,
    )

    const matches = await service.search('Milvus 资料', 3)

    expect(vectorSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 3,
        sourceScope: 'published',
      }),
    )
    expect(matches).toHaveLength(1)
    expect(matches[0]?.title).toBe('rag-notes.md')
    expect(matches[0]?.sourceType).toBe('user_docs')
  })

  it('should pass and enforce knowledge domains for vector store search', async () => {
    process.env.RAG_SEARCH_USE_VECTOR_STORE = 'true'
    process.env.RAG_SEARCH_VECTOR_SCOPE = 'published'

    const aiService = new AiService(
      createAiProvider(
        {
          provider: 'mock',
          mode: 'mock',
          model: 'mock-resume-advisor',
        },
        vi.fn<typeof fetch>(),
      ),
    )
    const vectorSearch = vi.fn().mockResolvedValue([
      {
        id: 'user-doc-hobby:1',
        documentId: 'user-doc:hobby:und',
        sourceType: 'user_docs',
        sourceScope: 'published',
        sourceVersion: 'upload:1770000000002',
        section: 'user_docs',
        content: '羽毛球和音乐是兴趣爱好补充资料。',
        embedding: [],
        metadataJson: {
          fileName: 'hobby.md',
          contentType: 'hobby',
          knowledgeDomain: 'hobbies',
          renderHint: 'hobby_card',
          richCard: {
            title: '羽毛球与音乐',
            description: '用运动和音乐调节节奏。',
            url: 'https://example.com/hobbies',
            imageUrl: 'https://example.com/hobby.png',
            keywords: ['羽毛球', '音乐'],
          },
        },
        score: 0.93,
      },
      {
        id: 'user-doc-project:1',
        documentId: 'user-doc:project:und',
        sourceType: 'user_docs',
        sourceScope: 'published',
        sourceVersion: 'upload:1770000000003',
        section: 'user_docs',
        content: '项目资料不应出现在 hobbies 域查询里。',
        embedding: [],
        metadataJson: {
          fileName: 'project.md',
          contentType: 'project',
          knowledgeDomain: 'projects',
          renderHint: 'project_card',
        },
        score: 0.91,
      },
    ])
    const service = new RagService(
      aiService,
      new RagChunkService(),
      new RagKnowledgeService(),
      new RagIndexRepository(),
      createMockRetrievalRepository(),
      {
        backend: 'milvus',
        upsertChunks: vi.fn(),
        deleteChunksByDocument: vi.fn(),
        search: vectorSearch,
      } as unknown as RagVectorStore,
    )

    const matches = await service.search('他有什么兴趣爱好', 4, undefined, {
      useVectorStore: true,
      vectorScope: 'published',
      fallbackToLocal: false,
      knowledgeDomains: ['hobbies'],
    })

    expect(vectorSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        knowledgeDomains: ['hobbies'],
        sourceScope: 'published',
      }),
    )
    expect(matches).toHaveLength(1)
    expect(matches[0]).toEqual(
      expect.objectContaining({
        id: 'user-doc-hobby:1',
        contentType: 'hobby',
        knowledgeDomain: 'hobbies',
        renderHint: 'hobby_card',
        richCard: {
          title: '羽毛球与音乐',
          description: '用运动和音乐调节节奏。',
          url: 'https://example.com/hobbies',
          imageUrl: 'https://example.com/hobby.png',
          keywords: ['羽毛球', '音乐'],
        },
      }),
    )
  })

  it('should enforce sourceTypes filters for vector store search', async () => {
    process.env.RAG_SEARCH_USE_VECTOR_STORE = 'true'
    process.env.RAG_SEARCH_VECTOR_SCOPE = 'all'

    const aiService = new AiService(
      createAiProvider(
        {
          provider: 'mock',
          mode: 'mock',
          model: 'mock-resume-advisor',
        },
        vi.fn<typeof fetch>(),
      ),
    )
    const vectorSearch = vi.fn().mockResolvedValue([
      {
        id: 'user-doc-only:1',
        documentId: 'user-doc-only',
        sourceType: 'user_docs',
        sourceScope: 'published',
        sourceVersion: 'upload:1770000000010',
        section: 'user_docs',
        content: 'Dao 核心原理笔记',
        embedding: [],
        metadataJson: {
          fileName: 'dao.md',
          knowledgeDomain: 'writing_media',
        },
        score: 0.94,
      },
      {
        id: 'resume-only:1',
        documentId: 'resume-only',
        sourceType: 'resume_core',
        sourceScope: 'published',
        sourceVersion: 'resume:1',
        section: 'experiences',
        content: '简历核心经历',
        embedding: [],
        metadataJson: {
          knowledgeDomain: 'experience',
        },
        score: 0.99,
      },
    ])
    const service = new RagService(
      aiService,
      new RagChunkService(),
      new RagKnowledgeService(),
      new RagIndexRepository(),
      createMockRetrievalRepository(),
      {
        backend: 'milvus',
        upsertChunks: vi.fn(),
        deleteChunksByDocument: vi.fn(),
        search: vectorSearch,
      } as unknown as RagVectorStore,
    )

    const matches = await service.search('Dao 核心原理', 4, undefined, {
      useVectorStore: true,
      vectorScope: 'all',
      fallbackToLocal: false,
      sourceTypes: ['user_docs'],
      preferSourceTypes: ['user_docs'],
    })

    expect(vectorSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceTypes: ['user_docs'],
        sourceScope: undefined,
      }),
    )
    expect(matches).toHaveLength(1)
    expect(matches[0]?.sourceType).toBe('user_docs')
  })

  it('should enforce documentIds filters for vector store search and ask citations', async () => {
    process.env.RAG_SEARCH_USE_VECTOR_STORE = 'true'
    process.env.RAG_SEARCH_VECTOR_SCOPE = 'all'

    const aiService = new AiService(
      createAiProvider(
        {
          provider: 'mock',
          mode: 'mock',
          model: 'mock-resume-advisor',
        },
        vi.fn<typeof fetch>(),
      ),
    )
    const vectorSearch = vi.fn().mockResolvedValue([
      {
        id: 'user-doc-only:1',
        documentId: 'user-doc:dao',
        sourceType: 'user_docs',
        sourceScope: 'published',
        sourceVersion: 'upload:1770000000010',
        section: 'user_docs',
        content: 'Dao 核心原理笔记',
        embedding: [],
        metadataJson: {
          fileName: 'dao.md',
          knowledgeDomain: 'writing_media',
        },
        score: 0.94,
      },
      {
        id: 'user-doc-other:1',
        documentId: 'user-doc:rag',
        sourceType: 'user_docs',
        sourceScope: 'published',
        sourceVersion: 'upload:1770000000011',
        section: 'user_docs',
        content: 'RAG 文章',
        embedding: [],
        metadataJson: {
          fileName: 'rag.md',
          knowledgeDomain: 'writing_media',
        },
        score: 0.91,
      },
    ])
    const service = new RagService(
      aiService,
      new RagChunkService(),
      new RagKnowledgeService(),
      new RagIndexRepository(),
      createMockRetrievalRepository(),
      {
        backend: 'milvus',
        upsertChunks: vi.fn(),
        deleteChunksByDocument: vi.fn(),
        listDocumentIds: vi.fn().mockResolvedValue([]),
        search: vectorSearch,
      } as unknown as RagVectorStore,
    )

    const matches = await service.search('Dao 核心原理', 4, undefined, {
      useVectorStore: true,
      vectorScope: 'all',
      fallbackToLocal: false,
      sourceTypes: ['user_docs'],
      documentIds: ['user-doc:dao'],
    })
    const askResult = await service.ask('Dao 核心原理是什么？', 4, 'zh', {
      useVectorStore: true,
      vectorScope: 'all',
      fallbackToLocal: false,
      sourceTypes: ['user_docs'],
      documentIds: ['user-doc:dao'],
    })

    expect(vectorSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        documentIds: ['user-doc:dao'],
      }),
    )
    expect(matches).toHaveLength(1)
    expect(matches[0]?.documentId).toBe('user-doc:dao')
    expect(askResult.citations).toEqual([
      expect.objectContaining({
        documentId: 'user-doc:dao',
      }),
    ])
  })

  it('should probe supplementary catalog by title and preview metadata', async () => {
    const aiService = new AiService(
      createAiProvider(
        {
          provider: 'mock',
          mode: 'mock',
          model: 'mock-resume-advisor',
        },
        vi.fn<typeof fetch>(),
      ),
    )
    const retrievalRepository = {
      listAllChunksWithDocuments: vi.fn().mockResolvedValue([]),
      listAllDocuments: vi.fn().mockResolvedValue([
        {
          id: 'user-doc:dao',
          title: '《Dao》核心原理',
          sourceType: 'user_docs',
          sourceScope: 'published',
          locale: 'und',
          metadataJson: {
            contentType: 'article',
            knowledgeDomain: 'writing_media',
            richCard: {
              keywords: ['Dao', '系统化'],
            },
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          previewContent: '围绕 Dao 核心原理展开的系统化笔记。',
        },
      ]),
    } as unknown as RagRetrievalRepository
    const service = new RagService(
      aiService,
      new RagChunkService(),
      new RagKnowledgeService(),
      new RagIndexRepository(),
      retrievalRepository,
      {
        backend: 'local',
        upsertChunks: vi.fn(),
        deleteChunksByDocument: vi.fn(),
        search: vi.fn().mockResolvedValue([]),
      } as unknown as RagVectorStore,
    )

    const hits = await service.probeSupplementCatalog('说说《Dao核心原理》是什么', 5, {
      sourceTypes: ['user_docs'],
      preferSourceTypes: ['user_docs'],
    })

    expect(hits).toEqual([
      expect.objectContaining({
        documentId: 'user-doc:dao',
        title: '《Dao》核心原理',
        knowledgeDomain: 'writing_media',
        contentType: 'article',
      }),
    ])
    expect(hits[0]?.score).toBeGreaterThan(0)
  })

  it('should fallback to local index when vector store is enabled but has no hits', async () => {
    process.env.RAG_SEARCH_USE_VECTOR_STORE = 'true'
    process.env.RAG_SEARCH_VECTOR_SCOPE = 'published'

    const aiService = new AiService(
      createAiProvider(
        {
          provider: 'mock',
          mode: 'mock',
          model: 'mock-resume-advisor',
        },
        vi.fn<typeof fetch>(),
      ),
    )
    const vectorSearch = vi.fn().mockResolvedValue([])
    const service = new RagService(
      aiService,
      new RagChunkService(),
      new RagKnowledgeService(),
      new RagIndexRepository(),
      createMockRetrievalRepository(),
      {
        backend: 'milvus',
        upsertChunks: vi.fn(),
        deleteChunksByDocument: vi.fn(),
        search: vectorSearch,
      } as unknown as RagVectorStore,
    )

    await service.rebuildIndex()
    const matches = await service.search('他做过 EDR 安全平台吗', 3)

    expect(vectorSearch).toHaveBeenCalledTimes(1)
    expect(
      matches.some((item) => item.title.includes('EDR') || item.content.includes('EDR')),
    ).toBe(true)
  })

  it('should return empty when vector store has no hits and fallback is disabled', async () => {
    process.env.RAG_SEARCH_USE_VECTOR_STORE = 'true'
    process.env.RAG_SEARCH_VECTOR_FALLBACK_TO_LOCAL = 'false'

    const aiService = new AiService(
      createAiProvider(
        {
          provider: 'mock',
          mode: 'mock',
          model: 'mock-resume-advisor',
        },
        vi.fn<typeof fetch>(),
      ),
    )
    const service = new RagService(
      aiService,
      new RagChunkService(),
      new RagKnowledgeService(),
      new RagIndexRepository(),
      createMockRetrievalRepository(),
      {
        backend: 'milvus',
        upsertChunks: vi.fn(),
        deleteChunksByDocument: vi.fn(),
        search: vi.fn().mockResolvedValue([]),
      } as unknown as RagVectorStore,
    )

    const matches = await service.search('没有命中', 3)

    expect(matches).toHaveLength(0)
  })

  it('should fallback to local search when vector store throws and fallback is enabled', async () => {
    process.env.RAG_SEARCH_USE_VECTOR_STORE = 'true'
    process.env.RAG_SEARCH_VECTOR_SCOPE = 'published'

    const aiService = new AiService(
      createAiProvider(
        {
          provider: 'mock',
          mode: 'mock',
          model: 'mock-resume-advisor',
        },
        vi.fn<typeof fetch>(),
      ),
    )
    const service = new RagService(
      aiService,
      new RagChunkService(),
      new RagKnowledgeService(),
      new RagIndexRepository(),
      createMockRetrievalRepository(),
      {
        backend: 'milvus',
        upsertChunks: vi.fn(),
        deleteChunksByDocument: vi.fn(),
        search: vi.fn().mockRejectedValue(new Error('connect ECONNREFUSED 127.0.0.1:19530')),
      } as unknown as RagVectorStore,
    )

    await service.rebuildIndex()
    const matches = await service.search('他做过 EDR 安全平台吗', 3)
    const status = service.getStatus()

    expect(
      matches.some((item) => item.title.includes('EDR') || item.content.includes('EDR')),
    ).toBe(true)
    expect(status.vectorStoreAvailable).toBe(false)
    expect(status.lastVectorStoreError).toContain('ECONNREFUSED')
    expect(status.effectiveSearchMode).toBe('vector_with_local_fallback')
  })

  it('should throw a normalized error when vector store throws and fallback is disabled', async () => {
    process.env.RAG_SEARCH_USE_VECTOR_STORE = 'true'
    process.env.RAG_SEARCH_VECTOR_FALLBACK_TO_LOCAL = 'false'

    const aiService = new AiService(
      createAiProvider(
        {
          provider: 'mock',
          mode: 'mock',
          model: 'mock-resume-advisor',
        },
        vi.fn<typeof fetch>(),
      ),
    )
    const service = new RagService(
      aiService,
      new RagChunkService(),
      new RagKnowledgeService(),
      new RagIndexRepository(),
      createMockRetrievalRepository(),
      {
        backend: 'milvus',
        upsertChunks: vi.fn(),
        deleteChunksByDocument: vi.fn(),
        search: vi.fn().mockRejectedValue(new Error('connect ECONNREFUSED 127.0.0.1:19530')),
      } as unknown as RagVectorStore,
    )

    await expect(service.search('Milvus failed', 2)).rejects.toThrow('ECONNREFUSED')
    expect(service.getStatus().vectorStoreAvailable).toBe(false)
  })

  it('should merge sqlite chunks with static resume index (#216 fix)', async () => {
    const aiService = new AiService(
      createAiProvider(
        {
          provider: 'mock',
          mode: 'mock',
          model: 'mock-resume-advisor',
        },
        vi.fn<typeof fetch>(),
      ),
    )
    const retrievalRepository = {
      listAllChunksWithDocuments: vi.fn().mockResolvedValue([
        {
          chunkId: 'resume-core:published:1',
          documentId: 'resume-core-doc:published',
          chunkIndex: 0,
          section: 'experiences',
          content: 'published scope sqlite resume core',
          embeddingJson: [1, 0, 0],
          metadataJson: null,
          documentSourceType: 'resume_core',
          documentSourceScope: 'published',
          documentTitle: 'Published Resume Core',
          documentSourceVersion: 'published:1',
        },
        {
          chunkId: 'user-doc:published:1',
          documentId: 'user-doc-doc:published',
          chunkIndex: 0,
          section: 'user_docs',
          content: 'published scope sqlite user doc',
          embeddingJson: [0.9, 0.1, 0],
          metadataJson: {
            fileName: 'published-note.md',
          },
          documentSourceType: 'user_docs',
          documentSourceScope: 'published',
          documentTitle: 'Published User Doc',
          documentSourceVersion: 'upload:1',
        },
      ]),
    } as unknown as RagRetrievalRepository
    const service = new RagService(
      aiService,
      new RagChunkService(),
      new RagKnowledgeService(),
      new RagIndexRepository(),
      retrievalRepository,
      {
        backend: 'local',
        upsertChunks: vi.fn(),
        deleteChunksByDocument: vi.fn(),
        search: vi.fn().mockResolvedValue([]),
      } as unknown as RagVectorStore,
    )

    const matches = await service.search('resume core', 8)

    // 三源融合：文件索引 resume_core + DB chunks + knowledge
    expect(matches.length).toBeGreaterThan(0)
    expect(matches[0]?.id).toBe('resume-core:published:1')
    expect(matches.some((item) => item.section === 'knowledge')).toBe(true)
  })

  it('should allow request-level routing override without changing env', async () => {
    const aiService = new AiService(
      createAiProvider(
        {
          provider: 'mock',
          mode: 'mock',
          model: 'mock-resume-advisor',
        },
        vi.fn<typeof fetch>(),
      ),
    )
    const vectorSearch = vi.fn().mockResolvedValue([
      {
        id: 'user-doc-chunk:2',
        documentId: 'user-doc:2:und',
        sourceType: 'user_docs',
        sourceScope: 'draft',
        sourceVersion: 'upload:1770000000001',
        section: 'user_docs',
        content: 'Request override routed search.',
        embedding: [],
        metadataJson: {
          fileName: 'override.md',
        },
        score: 0.83,
      },
    ])
    const service = new RagService(
      aiService,
      new RagChunkService(),
      new RagKnowledgeService(),
      new RagIndexRepository(),
      createMockRetrievalRepository(),
      {
        backend: 'milvus',
        upsertChunks: vi.fn(),
        deleteChunksByDocument: vi.fn(),
        search: vectorSearch,
      } as unknown as RagVectorStore,
    )

    const matches = await service.search(
      'override query',
      2,
      {},
      {
        useVectorStore: true,
        vectorScope: 'draft',
        fallbackToLocal: false,
      },
    )

    expect(vectorSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 2,
        sourceScope: 'draft',
      }),
    )
    expect(matches).toHaveLength(1)
    expect(matches[0]?.title).toBe('override.md')
  })
})
