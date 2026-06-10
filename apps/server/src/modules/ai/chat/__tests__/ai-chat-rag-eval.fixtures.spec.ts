import { describe, expect, it } from 'vitest'

import { AI_CHAT_RAG_EVAL_FIXTURES } from '../evaluation/ai-chat-rag-eval.fixtures'

describe('AI_CHAT_RAG_EVAL_FIXTURES', () => {
  it('covers the first M26 RAG routing domains and boundary case', () => {
    expect(AI_CHAT_RAG_EVAL_FIXTURES.map((item) => item.id)).toEqual([
      'project-recent-work',
      'hobby-strength',
      'writing-agent-articles',
      'out-of-scope-weather',
    ])
    expect(AI_CHAT_RAG_EVAL_FIXTURES).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          expectedIntent: 'rag',
          expectedKnowledgeDomains: ['resume_core', 'projects'],
          expectedBlockTypes: ['project_card'],
        }),
        expect.objectContaining({
          expectedIntent: 'rag',
          expectedKnowledgeDomains: ['resume_core', 'hobbies'],
          expectedBlockTypes: ['hobby_card'],
        }),
        expect.objectContaining({
          expectedIntent: 'rag',
          expectedKnowledgeDomains: ['resume_core', 'projects', 'writing_media'],
          expectedBlockTypes: ['article_card'],
        }),
        expect.objectContaining({
          expectedIntent: 'blocked',
          expectedKnowledgeDomains: [],
          expectedBlockTypes: [],
        }),
      ]),
    )
  })
})
