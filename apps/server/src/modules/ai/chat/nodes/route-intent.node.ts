import type { AiChatLocale } from '../ai-chat.types'
import { createRouterLlm } from './router-llm.factory'
import { parseKnowledgeDomains, RouteIntentSchema } from './route-intent.schema'

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
    const result = await router.invoke(prompt)

    const knowledgeDomains = parseKnowledgeDomains(result.knowledgeDomains)

    return {
      strategy: result.strategy,
      routeReason: result.reason,
      knowledgeDomains: knowledgeDomains ?? ([] as any),
    }
  }
}
