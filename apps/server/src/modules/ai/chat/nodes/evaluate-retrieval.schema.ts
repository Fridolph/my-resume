import { z } from 'zod/v4'

/**
 * 检索充分性评估 Schema。
 *
 * 评估节点用 LLM 判断当前检索上下文是否足以回答用户问题。
 * 来自 Agentic RAG 学习笔记 L3 webfallback 中的 evaluate 设计。
 */
export const EvaluateRetrievalSchema = z.object({
  /** 当前检索到的上下文是否足以回答问题 */
  enough: z.boolean().describe('Whether the retrieved context is sufficient to answer'),
  /** 若不够，缺失哪些关键信息 */
  missing: z.array(z.string()).optional().describe('What key information is missing'),
  /** 置信度 */
  confidence: z.enum(['high', 'medium', 'low']).describe('How confident is this evaluation'),
})

export type EvaluateRetrievalResult = z.infer<typeof EvaluateRetrievalSchema>
