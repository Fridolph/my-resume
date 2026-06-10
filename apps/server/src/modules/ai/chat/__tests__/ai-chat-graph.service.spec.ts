import { describe, expect, it, vi } from 'vitest'

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
        vectorScope: 'published',
      }),
      undefined,
    )
    expect(result.answer).toContain('音乐和羽毛球')
    expect(result.citations).toHaveLength(1)
    expect(result.blocks).toEqual([
      expect.objectContaining({
        type: 'hobby_card',
        title: '兴趣爱好',
      }),
    ])
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
})
