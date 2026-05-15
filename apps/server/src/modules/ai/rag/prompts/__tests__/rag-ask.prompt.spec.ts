import { describe, expect, it } from 'vitest'

import { buildRagAskPrompt, buildRagAskSystemPrompt } from '../rag-ask.prompt'

describe('RAG ask prompts', () => {
  it('builds Chinese grounded-answer prompts', () => {
    const prompt = buildRagAskPrompt({
      question: '候选人是否做过 RAG？',
      context: '[#1] 简历\nsection=projects\n做过 RAG 检索问答',
      locale: 'zh',
    })

    expect(buildRagAskSystemPrompt('zh')).toContain('只能根据检索到的简历上下文回答')
    expect(prompt).toContain('问题：候选人是否做过 RAG？')
    expect(prompt).toContain('检索到的上下文')
    expect(prompt).toContain('做过 RAG 检索问答')
    expect(prompt).toContain('[#n]')
  })

  it('builds English grounded-answer prompts', () => {
    const prompt = buildRagAskPrompt({
      question: 'Did the candidate build RAG features?',
      context: '[#1] Resume\nsection=projects\nBuilt retrieval QA.',
      locale: 'en',
    })

    expect(buildRagAskSystemPrompt('en')).toContain('Answer all resume-related questions in the first person')
    expect(prompt).toContain('Question: Did the candidate build RAG features?')
    expect(prompt).toContain('Retrieved context')
    expect(prompt).toContain('Built retrieval QA.')
    expect(prompt).toContain('[#n]')
  })
})
