import { z } from 'zod/v4'

import type { RagKnowledgeDomain } from '../../rag/rag-knowledge-domain'

/**
 * 路由决策 Zod Schema。
 *
 * 设计意图（来自 Agentic RAG 学习笔记）：
 * - strategy 决定走哪条边：chitchat/guide/out_of_scope → direct_answer
 * - knowledgeDomains 注入检索过滤，提升召回精度
 * - reason 用于日志/可观测，不做路由判断
 */
export const RouteIntentSchema = z.object({
  /** 意图分类 */
  strategy: z.enum([
    'chitchat',      // 打招呼、测试、寒暄
    'guide',         // 问"你能做什么"等引导性问题
    'resume',        // 简历核心内容：工作经历、项目、技能、教育
    'supplement',    // 补充资料：博客、文章、兴趣爱好
    'hybrid',        // 简历 + 补充资料联合（如"做过哪些项目，写过的文章"）
    'out_of_scope',  // 完全与本人无关的问题
  ]),
  /** 推荐检索的知识域（逗号分隔，为空表示不限制） */
  knowledgeDomains: z.string().optional().describe(
    'comma-separated: resume_core, projects, experience, skills, hobbies, writing_media',
  ),
  /** 路由决策理由（用于日志与调试） */
  reason: z.string(),
})

export type RouteIntentResult = z.infer<typeof RouteIntentSchema>

/**
 * 将 LLM 输出的 knowledgeDomains 字符串解析为标准知识域数组。
 */
export function parseKnowledgeDomains(raw?: string): RagKnowledgeDomain[] | undefined {
  if (!raw?.trim()) return undefined

  const validDomains = new Set<RagKnowledgeDomain>([
    'resume_core', 'projects', 'experience', 'skills', 'hobbies', 'writing_media',
  ])

  const domains = raw
    .split(',')
    .map((d) => d.trim() as RagKnowledgeDomain)
    .filter((d) => validDomains.has(d))

  return domains.length > 0 ? domains : undefined
}
