import type { RagKnowledgeDomain } from '../../rag/rag-knowledge-domain'
import type { AiChatLocale, AiChatMessageBlockType } from '../ai-chat.types'

export type AiChatRagEvalExpectedIntent = 'rag' | 'blocked'

export interface AiChatRagEvalFixtureCase {
  id: string
  locale: AiChatLocale
  question: string
  expectedIntent: AiChatRagEvalExpectedIntent
  expectedKnowledgeDomains: RagKnowledgeDomain[]
  expectedBlockTypes: AiChatMessageBlockType[]
  expectedCitationContentTypes: string[]
  notes: string
}

export const AI_CHAT_RAG_EVAL_FIXTURES: AiChatRagEvalFixtureCase[] = [
  {
    id: 'project-recent-work',
    locale: 'zh',
    question: '你最近做了什么项目？',
    expectedIntent: 'rag',
    expectedKnowledgeDomains: ['resume_core', 'projects'],
    expectedBlockTypes: ['project_card'],
    expectedCitationContentTypes: ['project'],
    notes: '项目类问题应优先路由到 projects，并返回项目卡片。',
  },
  {
    id: 'hobby-strength',
    locale: 'zh',
    question: '除了写代码，你还有什么兴趣爱好或特长？',
    expectedIntent: 'rag',
    expectedKnowledgeDomains: ['resume_core', 'hobbies'],
    expectedBlockTypes: ['hobby_card'],
    expectedCitationContentTypes: ['hobby'],
    notes: '兴趣爱好类问题应召回 hobbies 域，避免只用简历工作经历硬答。',
  },
  {
    id: 'writing-agent-articles',
    locale: 'zh',
    question: '你写过哪些 AI Agent 或 RAG 相关文章？',
    expectedIntent: 'rag',
    expectedKnowledgeDomains: ['resume_core', 'projects', 'writing_media'],
    expectedBlockTypes: ['article_card'],
    expectedCitationContentTypes: ['article'],
    notes: '创作/文章问题既可能命中 Agent 项目，也应覆盖 writing_media。',
  },
  {
    id: 'out-of-scope-weather',
    locale: 'zh',
    question: '明天北京天气怎么样？',
    expectedIntent: 'blocked',
    expectedKnowledgeDomains: [],
    expectedBlockTypes: [],
    expectedCitationContentTypes: [],
    notes: '明显越界问题应在 graph 边界层拒答，不进入 RAG 检索。',
  },
]
