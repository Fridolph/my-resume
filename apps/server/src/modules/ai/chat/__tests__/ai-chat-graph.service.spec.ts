import { Logger } from '@nestjs/common'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AiChatGraphService } from '../ai-chat-graph.service'
import { AiService } from '../../application/services/ai.service'
import { RagService } from '../../rag/rag.service'
import { ResumePublicationService } from '../../../resume/application/services/resume-publication.service'
import { createExampleStandardResume } from '../../../resume/domain/standard-resume'

function createGraphService() {
  const aiService = {
    generateText: vi.fn(),
    generateTextStream: vi.fn(),
  } as unknown as AiService & Record<string, ReturnType<typeof vi.fn>>
  const ragService = {
    ask: vi.fn(),
    probeSupplementCatalog: vi.fn().mockResolvedValue([]),
  } as unknown as RagService & Record<string, ReturnType<typeof vi.fn>>
  const resumePublicationService = {
    getPublished: vi.fn(),
  } as unknown as ResumePublicationService & Record<string, ReturnType<typeof vi.fn>>

  return {
    aiService,
    ragService,
    resumePublicationService,
    service: new AiChatGraphService(
      aiService as never,
      ragService as never,
      resumePublicationService as never,
    ),
  }
}

describe('AiChatGraphService', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('routes hobby questions to the hobbies knowledge domain and returns citation blocks', async () => {
    const { ragService, resumePublicationService, service } = createGraphService()

    resumePublicationService.getPublished.mockResolvedValue({
      resume: createExampleStandardResume(),
    })
    ragService.ask.mockResolvedValue({
      answer: '除了写代码，我也喜欢音乐和羽毛球 [#1]。',
      citations: [
        {
          id: 'hobby-001',
          ref: '#1',
          title: '兴趣爱好',
          section: 'user_docs',
          sourceType: 'user_docs',
          score: 0.86,
          snippet: '音乐、羽毛球和 AI Agent 实践是工作之外的重要兴趣。',
          contentType: 'hobby',
          knowledgeDomain: 'hobbies',
          tags: ['兴趣', '羽毛球'],
          richCard: {
            title: '音乐与羽毛球',
            description: '用音乐和羽毛球调节节奏，也保持长期练习的手感。',
            url: 'https://example.com/hobbies',
            imageUrl: 'https://example.com/hobby.png',
            keywords: ['音乐', '羽毛球'],
            media: [
              {
                type: 'link',
                url: 'https://example.com/playlist',
                title: '练习歌单',
              },
            ],
          },
        },
      ],
      matches: [],
      providerSummary: undefined,
    })

    const result = await service.generateAnswer({
      locale: 'zh',
      question: '你还有些什么兴趣爱好吗？',
    })

    expect(ragService.ask).toHaveBeenCalledWith(
      '你还有些什么兴趣爱好吗？',
      15,
      'zh',
      expect.objectContaining({
        knowledgeDomains: ['hobbies'],
        sourceTypes: ['user_docs', 'knowledge'],
        preferSourceTypes: ['user_docs', 'knowledge'],
      }),
      expect.objectContaining({
        minAcceptedCitationScore: 0.1,
        onToken: undefined,
      }),
    )
    expect(result.answer).toContain('音乐和羽毛球')
    expect(result.citations).toHaveLength(1)
    expect(result.blocks).toEqual([
      expect.objectContaining({
        type: 'hobby_card',
        title: '音乐与羽毛球',
        description: expect.stringContaining('调节节奏'),
        url: 'https://example.com/hobbies',
        imageUrl: 'https://example.com/hobby.png',
        keywords: ['音乐', '羽毛球'],
        media: [
          expect.objectContaining({
            title: '练习歌单',
          }),
        ],
      }),
    ])
  })

  it('filters hobby citations to the same topic, keeps one hobby card, and never exposes sourcePath links', async () => {
    const { ragService, resumePublicationService, service } = createGraphService()

    resumePublicationService.getPublished.mockResolvedValue({
      resume: createExampleStandardResume(),
    })
    ragService.ask.mockResolvedValue({
      answer: '我平时会打羽毛球，也把它当成长期坚持的兴趣 [#1] [#2] [#3] [#4]。',
      citations: [
        {
          id: 'hobby-generic-001',
          ref: '#1',
          title: '兴趣爱好',
          section: 'user_docs',
          sourceType: 'user_docs',
          score: 0.89,
          snippet: '羽毛球是我长期保持的运动兴趣，也会在周末持续练习。',
          contentType: 'hobby',
          knowledgeDomain: 'hobbies',
          tags: ['兴趣', '羽毛球'],
        },
        {
          id: 'hobby-badminton-002',
          ref: '#2',
          title: '喜欢羽毛球.md',
          section: 'user_docs',
          sourceType: 'user_docs',
          score: 0.92,
          snippet: '中羽 LV5，偏业余高手水平，也喜欢通过运动调节工作节奏。',
          contentType: 'hobby',
          knowledgeDomain: 'hobbies',
          tags: ['羽毛球', '运动'],
        },
        {
          id: 'hobby-book-003',
          ref: '#3',
          title: '易经',
          section: 'user_docs',
          sourceType: 'user_docs',
          score: 0.83,
          snippet: '我会把周易当作一种理解复杂系统的方式。',
          contentType: 'hobby',
          knowledgeDomain: 'hobbies',
          tags: ['周易', '思考'],
        },
        {
          id: 'hobby-music-004',
          ref: '#4',
          title: '音乐',
          section: 'user_docs',
          sourceType: 'user_docs',
          score: 0.8,
          snippet: '音乐是我工作之外调节节奏的重要方式。',
          contentType: 'hobby',
          knowledgeDomain: 'hobbies',
          tags: ['音乐'],
          richCard: {
            title: '音乐',
            description: '平时会通过音乐切换状态。',
            url: 'https://example.com/music',
          },
        },
      ],
      matches: [],
      providerSummary: undefined,
    })

    const result = await service.generateAnswer({
      locale: 'zh',
      question: '你的羽毛球水平？',
    })

    expect(result.citations.map((citation) => citation.ref)).toEqual(['#1', '#2'])
    expect(result.citations.every((citation) => {
      const searchable = [citation.title, citation.snippet, ...(citation.tags ?? [])].join(' ')
      return searchable.includes('羽毛球')
    })).toBe(true)
    expect(result.blocks).toEqual([
      expect.objectContaining({
        type: 'hobby_card',
        title: '喜欢羽毛球',
        description: expect.stringContaining('中羽 LV5'),
        url: undefined,
      }),
    ])
  })

  it('keeps multiple hobby citations when a broad hobby answer mentions multiple interests', async () => {
    const { ragService, resumePublicationService, service } = createGraphService()

    resumePublicationService.getPublished.mockResolvedValue({
      resume: createExampleStandardResume(),
    })
    ragService.ask.mockResolvedValue({
      answer: '除了写代码，我还喜欢羽毛球、音乐、易经，也在继续学习奇门遁甲。',
      citations: [
        {
          id: 'hobby-badminton-001',
          ref: '#1',
          title: '羽毛球',
          section: 'user_docs',
          sourceType: 'user_docs',
          score: 0.93,
          snippet: '中羽 LV5，偏业余高手水平，也喜欢通过运动调节工作节奏。',
          contentType: 'hobby',
          knowledgeDomain: 'hobbies',
          tags: ['羽毛球', '运动'],
        },
        {
          id: 'hobby-music-002',
          ref: '#2',
          title: '音乐',
          section: 'user_docs',
          sourceType: 'user_docs',
          score: 0.89,
          snippet: '音乐是我工作之外调节节奏的重要方式。',
          contentType: 'hobby',
          knowledgeDomain: 'hobbies',
          tags: ['音乐'],
        },
        {
          id: 'hobby-book-003',
          ref: '#3',
          title: '易经',
          section: 'user_docs',
          sourceType: 'user_docs',
          score: 0.87,
          snippet: '我会把周易当作一种理解复杂系统的方式。',
          contentType: 'hobby',
          knowledgeDomain: 'hobbies',
          tags: ['周易', '思考'],
        },
        {
          id: 'hobby-qimen-004',
          ref: '#4',
          title: '奇门遁甲',
          section: 'user_docs',
          sourceType: 'user_docs',
          score: 0.85,
          snippet: '目前还在持续学习和摸索奇门遁甲相关内容。',
          contentType: 'hobby',
          knowledgeDomain: 'hobbies',
          tags: ['奇门遁甲', '学习'],
        },
      ],
      matches: [],
      providerSummary: undefined,
    })

    const result = await service.generateAnswer({
      locale: 'zh',
      question: '你有哪些兴趣爱好呢？',
    })

    expect(result.answer).toContain('奇门遁甲')
    expect(result.citations.map((citation) => citation.title)).toEqual([
      '羽毛球',
      '音乐',
      '易经',
      '奇门遁甲',
    ])
    expect(result.blocks).toHaveLength(1)
    expect(result.blocks[0]).toEqual(
      expect.objectContaining({
        type: 'hobby_card',
      }),
    )
  })

  it('routes project questions to resume_core plus projects and keeps citation domains', async () => {
    const { ragService, resumePublicationService, service } = createGraphService()

    resumePublicationService.getPublished.mockResolvedValue({
      resume: createExampleStandardResume(),
    })
    ragService.ask.mockResolvedValue({
      answer: '我最近主要在做 my-resume 在线简历项目 [#1]。',
      citations: [
        {
          id: 'resume-project-001',
          ref: '#1',
          title: 'my-resume 在线简历',
          section: 'project',
          sourceType: 'resume_core',
          score: 0.91,
          snippet: 'my-resume 在线简历是一个公开站和 AI 对话结合的项目。',
          contentType: 'project',
          knowledgeDomain: 'projects',
          renderHint: 'project_card',
        },
      ],
      matches: [],
      providerSummary: undefined,
    })

    const result = await service.generateAnswer({
      locale: 'zh',
      question: '你最近做了什么项目？',
    })

    expect(ragService.ask).toHaveBeenCalledWith(
      '你最近做了什么项目？',
      15,
      'zh',
      expect.objectContaining({
        knowledgeDomains: ['projects'],
        sourceTypes: ['resume_core'],
        preferSourceTypes: ['resume_core'],
      }),
      expect.objectContaining({
        minAcceptedCitationScore: 0.1,
        onToken: undefined,
      }),
    )
    expect(result.citations[0]).toEqual(
      expect.objectContaining({
        knowledgeDomain: 'projects',
        score: 0.91,
      }),
    )
    expect(result.blocks.some((block) => block.type === 'project_card')).toBe(true)
  })

  it('routes writing questions to resume_core plus writing_media', async () => {
    const { ragService, resumePublicationService, service } = createGraphService()

    resumePublicationService.getPublished.mockResolvedValue({
      resume: createExampleStandardResume(),
    })
    ragService.ask.mockResolvedValue({
      answer: '我写过 JS 全栈 AI Agent 学习系列，里面有 RAG 相关实践 [#1]。',
      citations: [
        {
          id: 'article-001',
          ref: '#1',
          title: 'JS 全栈 AI Agent 学习',
          section: 'user_docs',
          sourceType: 'user_docs',
          score: 0.88,
          snippet: '围绕 AI Agent、RAG、向量检索和切片策略做系统学习记录。',
          contentType: 'article',
          knowledgeDomain: 'writing_media',
          renderHint: 'article_card',
          tags: ['AI Agent', 'RAG'],
          richCard: {
            title: 'JS 全栈 AI Agent 学习',
            description: '系统记录 Agent、RAG 与向量检索落地过程。',
            url: 'https://example.com/articles/agent',
            imageUrl: 'https://example.com/agent.png',
            publishedAt: '2026-05-01',
            keywords: ['Agent', 'RAG'],
          },
        },
      ],
      matches: [],
      providerSummary: undefined,
    })

    const result = await service.generateAnswer({
      locale: 'zh',
      question: '你最近写过什么博客文章？',
    })

    expect(ragService.ask).toHaveBeenCalledWith(
      '你最近写过什么博客文章？',
      15,
      'zh',
      expect.objectContaining({
        knowledgeDomains: ['writing_media'],
        sourceTypes: ['user_docs', 'knowledge'],
        preferSourceTypes: ['user_docs', 'knowledge'],
      }),
      expect.objectContaining({
        minAcceptedCitationScore: 0.1,
        onToken: undefined,
      }),
    )
    expect(result.citations[0]).toEqual(
      expect.objectContaining({
        knowledgeDomain: 'writing_media',
        score: 0.88,
      }),
    )
    expect(result.blocks).toEqual([
      expect.objectContaining({
        type: 'article_card',
        title: 'JS 全栈 AI Agent 学习',
        summary: expect.stringContaining('向量检索'),
        url: 'https://example.com/articles/agent',
        imageUrl: 'https://example.com/agent.png',
        publishedAt: '2026-05-01',
      }),
    ])
  })

  it('maps user docs project rich metadata into project cards', async () => {
    const { ragService, resumePublicationService, service } = createGraphService()

    resumePublicationService.getPublished.mockResolvedValue({
      resume: createExampleStandardResume(),
    })
    ragService.ask.mockResolvedValue({
      answer: '我也补充整理过 AI Intro 互动项目资料 [#1]。',
      citations: [
        {
          id: 'user-doc-project-001',
          ref: '#1',
          title: 'AI Intro 互动项目',
          section: 'user_docs',
          sourceType: 'user_docs',
          score: 0.87,
          snippet: '一个通过问答逐步解锁人物画像和技能拼图的互动项目。',
          contentType: 'project',
          knowledgeDomain: 'projects',
          renderHint: 'project_card',
          tags: ['Next.js', 'AGUI'],
          richCard: {
            title: 'AI Intro 互动项目',
            description: '用预设问题、RAG 和技能拼图串联个人介绍体验。',
            url: 'https://example.com/ai-intro',
            imageUrl: 'https://example.com/ai-intro.png',
            keywords: ['Next.js', 'RAG', 'AGUI'],
          },
        },
      ],
      matches: [],
      providerSummary: undefined,
    })

    const result = await service.generateAnswer({
      locale: 'zh',
      question: '你做过什么 AI intro 项目？',
    })

    expect(result.blocks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'project_card',
          title: 'AI Intro 互动项目',
          summary: expect.stringContaining('技能拼图'),
          technologies: ['Next.js', 'RAG', 'AGUI'],
          url: 'https://example.com/ai-intro',
          imageUrl: 'https://example.com/ai-intro.png',
        }),
      ]),
    )
  })

  it('routes title-like supplementary questions via catalog probe hits', async () => {
    const { ragService, resumePublicationService, service } = createGraphService()

    resumePublicationService.getPublished.mockResolvedValue({
      resume: createExampleStandardResume(),
    })
    ragService.probeSupplementCatalog.mockResolvedValue([
      {
        documentId: 'user-doc:dao',
        title: '《Dao》核心原理',
        sourceType: 'user_docs',
        sourceScope: 'published',
        knowledgeDomain: 'writing_media',
        contentType: 'article',
        preview: '围绕 Dao 核心原理展开的系统化笔记。',
        score: 1.4,
      },
    ])
    ragService.ask.mockResolvedValue({
      answer: '《Dao》核心原理主要是在讲系统化的拆解与协同方式 [#1]。',
      citations: [
        {
          id: 'dao-001',
          ref: '#1',
          title: '《Dao》核心原理',
          section: 'user_docs',
          sourceType: 'user_docs',
          score: 0.92,
          snippet: '围绕 Dao 核心原理展开的系统化笔记。',
          contentType: 'article',
          knowledgeDomain: 'writing_media',
        },
      ],
      matches: [],
      providerSummary: undefined,
    })

    const result = await service.generateAnswer({
      locale: 'zh',
      question: '说说《Dao核心原理》是什么',
    })

    expect(ragService.probeSupplementCatalog).toHaveBeenCalledWith(
      '说说《Dao核心原理》是什么',
      5,
      {
        sourceTypes: ['user_docs'],
        preferSourceTypes: ['user_docs'],
      },
    )
    expect(ragService.ask).toHaveBeenCalledWith(
      '说说《Dao核心原理》是什么',
      15,
      'zh',
      expect.objectContaining({
        knowledgeDomains: ['writing_media'],
        sourceTypes: ['user_docs', 'knowledge'],
        preferSourceTypes: ['user_docs', 'knowledge'],
        documentIds: ['user-doc:dao'],
      }),
      expect.objectContaining({
        minAcceptedCitationScore: 0.1,
      }),
    )
    expect(result.answer).toContain('系统化')
    expect(result.citations[0]).toEqual(
      expect.objectContaining({
        sourceType: 'user_docs',
        knowledgeDomain: 'writing_media',
      }),
    )
  })

  it('logs retrieval domains, top citations, and answer block summaries', async () => {
    const { ragService, resumePublicationService, service } = createGraphService()
    const logSpy = vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined)

    resumePublicationService.getPublished.mockResolvedValue({
      resume: createExampleStandardResume(),
    })
    ragService.ask.mockResolvedValue({
      answer: '我平时喜欢音乐和羽毛球 [#1]。',
      citations: [
        {
          id: 'hobby-001',
          ref: '#1',
          title: '兴趣爱好',
          section: 'user_docs',
          sourceType: 'user_docs',
          score: 0.86,
          snippet: '音乐、羽毛球和 AI Agent 实践是工作之外的重要兴趣。'.repeat(8),
          contentType: 'hobby',
          knowledgeDomain: 'hobbies',
          renderHint: 'hobby_card',
          tags: ['兴趣'],
          richCard: {
            title: '音乐与羽毛球',
            description: '用音乐和羽毛球调节节奏。',
            keywords: ['音乐', '羽毛球'],
          },
        },
      ],
      matches: [],
      providerSummary: undefined,
    })

    await service.generateAnswer({
      locale: 'zh',
      question: '你有什么兴趣爱好？',
    })

    const payloads = logSpy.mock.calls.map(([payload]) => payload)
    expect(payloads).toContainEqual(
      expect.objectContaining({
        event: 'ai-chat.graph.retrieval_completed',
        routeKind: 'supplement_only',
        knowledgeDomains: ['hobbies'],
        sourceTypes: ['user_docs', 'knowledge'],
        matchCount: 0,
        citationCount: 1,
        fallbackReason: null,
        topCitations: [
          expect.objectContaining({
            ref: '#1',
            score: 0.86,
            knowledgeDomain: 'hobbies',
            contentType: 'hobby',
            renderHint: 'hobby_card',
            hasRichCard: true,
            snippet: expect.stringMatching(/\.\.\.$/),
          }),
        ],
      }),
    )
    expect(payloads).toContainEqual(
      expect.objectContaining({
        event: 'ai-chat.graph.node_completed',
        node: 'answer_compose',
        blockTypes: [
          expect.objectContaining({
            type: 'hobby_card',
            title: '音乐与羽毛球',
          }),
        ],
      }),
    )
  })

  it('logs resume summary fallback reasons and block summaries', async () => {
    const { aiService, ragService, resumePublicationService, service } = createGraphService()
    const logSpy = vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined)

    resumePublicationService.getPublished.mockResolvedValue({
      resume: createExampleStandardResume(),
    })
    ragService.ask.mockResolvedValue({
      answer: '',
      citations: [],
      matches: [],
      providerSummary: undefined,
    })
    aiService.generateText.mockResolvedValue({
      text: '我主要是全栈和 AI Agent 方向，也在持续补充 RAG 实践。',
      providerSummary: {
        provider: 'mock',
        model: 'mock-chat',
        mode: 'mock',
      },
    })

    const result = await service.generateAnswer({
      locale: 'zh',
      question: '介绍一下你的技术方向',
    })

    const payloads = logSpy.mock.calls.map(([payload]) => payload)
    expect(result.answer).toContain('AI Agent')
    expect(payloads).toContainEqual(
      expect.objectContaining({
        event: 'ai-chat.graph.retrieval_completed',
        citationCount: 0,
        fallbackReason: 'no_citation_use_resume_summary',
      }),
    )
    expect(payloads).toContainEqual(
      expect.objectContaining({
        event: 'ai-chat.graph.resume_fallback',
        blockCount: 0,
        blockTypes: [],
      }),
    )
  })

  it('blocks clearly unrelated questions before retrieval', async () => {
    const { ragService, resumePublicationService, service } = createGraphService()

    const result = await service.generateAnswer({
      locale: 'zh',
      question: '明天北京天气怎么样？',
    })

    expect(ragService.ask).not.toHaveBeenCalled()
    expect(resumePublicationService.getPublished).not.toHaveBeenCalled()
    expect(result.answer).toContain('只能回答关于我的背景')
  })

  it('uses the resume summary fallback when retrieval fails', async () => {
    const { aiService, ragService, resumePublicationService, service } = createGraphService()

    resumePublicationService.getPublished.mockResolvedValue({
      resume: createExampleStandardResume(),
    })
    ragService.ask.mockRejectedValue(new Error('vector store offline'))
    aiService.generateText.mockResolvedValue({
      text: '我主要是 JS 全栈 / AI Agent 开发方向，最近也在推进 RAG 与 Agent 实践。',
      providerSummary: {
        provider: 'mock',
        model: 'mock-chat',
        mode: 'mock',
      },
    })

    const result = await service.generateAnswer({
      locale: 'zh',
      question: '介绍一下你的技术方向',
    })

    expect(ragService.ask).toHaveBeenCalled()
    expect(aiService.generateText).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining('简历摘要'),
      }),
    )
    expect(result.answer).toContain('AI Agent')
  })

  it('returns a guarded answer for low relevance citation scores', async () => {
    const { ragService, resumePublicationService, service } = createGraphService()

    resumePublicationService.getPublished.mockResolvedValue({
      resume: createExampleStandardResume(),
    })
    ragService.probeSupplementCatalog.mockResolvedValue([
      {
        documentId: 'user-doc:dao',
        title: '《Dao》核心原理',
        sourceType: 'user_docs',
        sourceScope: 'published',
        knowledgeDomain: 'writing_media',
        contentType: 'article',
        preview: '围绕 Dao 核心原理展开的系统化笔记。',
        score: 1.2,
      },
    ])
    ragService.ask.mockResolvedValue({
      answer: '这个低分答案不应直接返回。',
      citations: [
        {
          id: 'weak-001',
          ref: '#1',
          title: '弱相关片段',
          section: 'user_docs',
          sourceType: 'user_docs',
          score: 0.04,
          snippet: '弱相关内容',
          knowledgeDomain: 'writing_media',
        },
      ],
      matches: [],
      providerSummary: undefined,
    })

    const result = await service.generateAnswer({
      locale: 'zh',
      question: '说说《Dao核心原理》是什么',
    })

    expect(result.answer).toContain('补充资料')
    expect(result.citations).toHaveLength(0)
  })

  it('passes the citation score threshold into rag retrieval and avoids leaking low-score stream tokens', async () => {
    const { ragService, resumePublicationService, service } = createGraphService()
    const tokenSpy = vi.fn()

    resumePublicationService.getPublished.mockResolvedValue({
      resume: createExampleStandardResume(),
    })
    ragService.probeSupplementCatalog.mockResolvedValue([
      {
        documentId: 'user-doc:dao',
        title: '《Dao》核心原理',
        sourceType: 'user_docs',
        sourceScope: 'published',
        knowledgeDomain: 'writing_media',
        contentType: 'article',
        preview: '围绕 Dao 核心原理展开的系统化笔记。',
        score: 1.1,
      },
    ])
    ragService.ask.mockResolvedValue({
      answer: '',
      citations: [
        {
          id: 'weak-002',
          ref: '#1',
          title: '弱相关片段',
          section: 'user_docs',
          sourceType: 'user_docs',
          score: 0.04,
          snippet: '弱相关内容',
          knowledgeDomain: 'writing_media',
        },
      ],
      matches: [],
      providerSummary: undefined,
    })

    const result = await service.generateAnswer({
      locale: 'zh',
      question: '说说《Dao核心原理》是什么',
      onToken: tokenSpy,
    })

    expect(ragService.ask).toHaveBeenCalledWith(
      '说说《Dao核心原理》是什么',
      15,
      'zh',
      expect.objectContaining({
        knowledgeDomains: ['writing_media'],
        sourceTypes: ['user_docs', 'knowledge'],
        preferSourceTypes: ['user_docs', 'knowledge'],
        documentIds: ['user-doc:dao'],
      }),
      expect.objectContaining({
        minAcceptedCitationScore: 0.1,
        onToken: tokenSpy,
      }),
    )
    expect(tokenSpy).not.toHaveBeenCalled()
    expect(result.answer).toContain('补充资料')
    expect(result.citations).toHaveLength(0)
  })
})
