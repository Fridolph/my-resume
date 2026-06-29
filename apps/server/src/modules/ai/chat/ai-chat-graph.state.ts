import { Annotation } from '@langchain/langgraph'

import type { RagKnowledgeDomain } from '../rag/rag-knowledge-domain'
import type {
  RagAskCitation,
  RagRetrievalSourceType,
  RagSearchMatch,
} from '../rag/rag.types'
import type { AiChatLocale, AiChatMessageBlock } from './ai-chat.types'

/**
 * AI Chat Graph 共享状态。
 *
 * 字段设计原则（dao-grill M30）：
 * - 只放跨节点传递的字段，不放节点内部临时变量
 * - 有循环就必须有游标 + 计数器 + 终止条件
 * - 默认 reducer = last-write-wins（符合单用户单轮对话语义）
 */
export const AiChatGraphState = Annotation.Root({
  // ── 输入 ──
  question: Annotation<string>,
  locale: Annotation<AiChatLocale>,

  // ── 路由决策 ──
  strategy: Annotation<
    'chitchat' | 'guide' | 'resume' | 'supplement' | 'hybrid' | 'out_of_scope'
  >,
  routeReason: Annotation<string>,
  knowledgeDomains: Annotation<RagKnowledgeDomain[]>,
  sourceTypes: Annotation<RagRetrievalSourceType[]>,
  preferSourceTypes: Annotation<RagRetrievalSourceType[]>,

  // ── 多跳拆解（M31） ──
  decompositionNeeded: Annotation<boolean>,
  subQuestions: Annotation<string[]>,
  /** 游标：当前该检索第几条子问题（0-based） */
  nextSubIdx: Annotation<number>,

  // ── 检索结果 ──
  documents: Annotation<RagSearchMatch[]>,
  citations: Annotation<RagAskCitation[]>,
  /** 已执行检索轮数（防死循环） */
  retrievalCount: Annotation<number>,
  /** 检索轮数上限 */
  maxRetrievals: Annotation<number>,

  // ── 检索后评估（M30 Issue 3） ──
  evaluation: Annotation<{
    enough: boolean
    missing?: string[]
    confidence?: 'high' | 'medium' | 'low'
  }>,

  // ── 循环控制（M31） ──
  /**
   * plan_next 写入 → afterPlan 条件边读取 → 跳转。
   * 'retrieve' 回边循环，'generate' 终止进入评估。
   */
  plannedNext: Annotation<'retrieve' | 'generate'>,

  // ── 输出 ──
  answer: Annotation<string>,
  blocks: Annotation<AiChatMessageBlock[]>,
})
