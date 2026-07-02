import { Logger } from '@nestjs/common'
import type { AiChatLocale } from '../ai-chat.types'
import { createRouterLlm } from './router-llm.factory'
import { parseKnowledgeDomains, RouteIntentSchema } from './route-intent.schema'

const logger = new Logger('RouteIntentNode')

/**
 * 路由 Prompt 模板。
 *
 * 设计要点（来自 Agentic RAG 学习笔记）：
 * - 明确区分 6 种 strategy，每个有清晰边界
 * - 强调"只基于问题本身判断"，不假设任何外部上下文
 * - 补充资料(supplement)指文章/博客/兴趣爱好，非简历核心信息
 */
function buildRoutePrompt(question: string, locale: AiChatLocale): string {
  const langHint = locale === 'en'
    ? 'The user is asking in English. Classify the intent accordingly.'
    : '用户使用中文提问。请据此分类。'

  return `你是问答路由器。判断用户问题的意图，输出策略和推荐知识域。

## 策略定义

- chitchat：打招呼（你好/hi/hello）、测试（test/测试/ping）、简短寒暄
- guide：询问你能做什么、有什么功能（"你能做什么""what can you do"）
- resume：询问简历核心内容——工作经历、项目、技能、教育背景、个人介绍
- supplement：询问补充资料——博客文章、创作、兴趣爱好、学习笔记、职业规划、写作媒体
- hybrid：同时涉及简历和补充资料（如"做过哪些AI项目，写过什么相关文章"）
- out_of_scope：完全与本人/FYS无关（天气/股票/政治/闲聊其他人物）

## 知识域说明

- resume_core：个人基本信息
- projects：项目经历
- experience：工作经历
- skills：技术技能
- hobbies：兴趣爱好
- writing_media：文章、博客、创作、媒体

## 规则

1. 涉及"我/你/你的/FYS/简历/工作/项目/技能" → 优先 resume 或 hybrid
2. 涉及"文章/博客/兴趣/爱好/创作/写作" → 优先 supplement 或 hybrid
3. 同时涉及简历和补充 → hybrid
4. 完全无关 → out_of_scope
5. 不知道是什么问题 → resume（默认检索简历）

${langHint}

用户问题：${question}`
}

/**
 * route_intent 节点工厂。
 *
 * 使用 LLM withStructuredOutput 做语义路由，
 * 替代旧版正则驱动的 classifyQuestion + routeIntentAndDomain。
 */
export function createRouteIntentNode() {
  const routerLlm = createRouterLlm()
  const router = routerLlm.withStructuredOutput(RouteIntentSchema, {
    method: 'functionCalling',
    name: 'route_intent',
  })

  return async (state: { question: string; locale: AiChatLocale }) => {
    const prompt = buildRoutePrompt(state.question, state.locale)

    try {
      const result = await router.invoke(prompt)
      const knowledgeDomains = parseKnowledgeDomains(result.knowledgeDomains)

      const sourceTypes = resolveSourceTypes(result.strategy)

      return {
        strategy: result.strategy,
        routeReason: result.reason,
        knowledgeDomains: knowledgeDomains ?? ([] as any),
        sourceTypes,
        preferSourceTypes: sourceTypes,
      }
    } catch (error) {
      // LLM 路由失败 → 回退到正则
      logger.warn({
        event: 'graph.route_intent.llm_fallback',
        question: state.question.slice(0, 80),
        error: error instanceof Error ? error.message : String(error),
      })

      return fallbackRoute(state.question)
    }
  }
}

/**
 * LLM 路由失败时的正则兜底路由。
 *
 * 当 LLM withStructuredOutput 调用失败（网络超时、模型返回格式异常等）时，
 * 回退到关键词正则匹配，保证系统可用性。
 *
 * ## 路由优先级
 *
 * 1. 越界检测：天气/股票/彩票/政治/新闻 → `out_of_scope`（直接拒绝）
 * 2. 打招呼：你好/hi/hello/测试 → `chitchat`（直接回复问候语）
 * 3. 补充资料：博客/文章/兴趣/爱好/特长/休闲 → `supplement`（查 user_docs + knowledge）
 * 4. 默认兜底：`resume`（查简历核心内容）
 *
 * @param question - 用户原始问题
 * @returns 路由决策（strategy + routeReason + knowledgeDomains + sourceTypes）
 */
function fallbackRoute(question: string) {
  const lower = question.toLowerCase()

  // 越界问题：与简历完全无关，直接拒绝
  if (/天气|股票|彩票|政治|新闻/.test(lower)) {
    return { strategy: 'out_of_scope' as const, routeReason: 'rule:out_of_scope', knowledgeDomains: [], sourceTypes: undefined, preferSourceTypes: undefined }
  }
  // 打招呼/测试：无需检索，直接返回问候语
  if (/^(你好|hi|hello|hey|哈喽|嗨|在吗|测试|test)$/i.test(question.trim())) {
    return { strategy: 'chitchat' as const, routeReason: 'rule:greeting', knowledgeDomains: [], sourceTypes: undefined, preferSourceTypes: undefined }
  }
  // 补充资料：兴趣爱好/博客/文章等非简历核心内容
  if (/博客|文章|写作|创作|兴趣|爱好|特长|休闲|喜欢/.test(lower)) {
    return { strategy: 'supplement' as const, routeReason: 'rule:supplement', knowledgeDomains: ['hobbies', 'writing_media'] as any, sourceTypes: ['user_docs', 'knowledge'] as any, preferSourceTypes: ['user_docs', 'knowledge'] as any }
  }
  // 默认：查简历核心内容
  return { strategy: 'resume' as const, routeReason: 'rule:resume_default', knowledgeDomains: [], sourceTypes: ['resume_core'] as any, preferSourceTypes: ['resume_core'] as any }
}

/**
 * 按 strategy 映射 sourceTypes。
 *
 * 对齐 legacy `routeIntentAndDomain` 的 sourceTypes 语义：
 * - `supplement` → 用户补充资料 + 静态知识库（user_docs + knowledge）
 * - `hybrid` → 简历核心 + 用户补充资料（resume_core + user_docs）
 * - `resume` → 仅简历核心（resume_core）
 * - 其他（chitchat/guide/out_of_scope）→ 不检索，返回 undefined
 *
 * @param strategy - LLM 路由输出的策略类型
 * @returns sourceTypes 数组 或 undefined（不需检索）
 */
function resolveSourceTypes(strategy: string) {
  switch (strategy) {
    case 'supplement': return ['user_docs', 'knowledge'] as any
    case 'hybrid': return ['resume_core', 'user_docs'] as any
    case 'resume': return ['resume_core'] as any
    // chitchat / guide / out_of_scope：不需要检索
    default: return undefined
  }
}
