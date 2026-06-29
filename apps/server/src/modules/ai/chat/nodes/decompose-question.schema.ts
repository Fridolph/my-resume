import { z } from 'zod/v4'

/**
 * 子问题拆解 Schema。
 *
 * 来自 Agentic RAG L4 multihop 的 decompose_question 设计。
 * 要求每条子问题独立可检索、禁止指代。
 */
export const DecomposeQuestionSchema = z.object({
  /** 有序子问题列表，每条必须是完整中文/英文问句 */
  subQuestions: z
    .array(z.string())
    .describe(
      'Ordered sub-questions, each self-contained and independently searchable. '
      + 'No pronouns (他/她/此人/it/they). Must follow reasoning chain order.',
    ),
})

export type DecomposeQuestionResult = z.infer<typeof DecomposeQuestionSchema>
