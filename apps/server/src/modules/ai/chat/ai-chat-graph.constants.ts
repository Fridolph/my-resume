/**
 * AI Chat LangGraph 引擎常量。
 *
 * M30 Issue 1 — 灰度开关与默认配置。
 */

/** 默认检索轮数上限（多跳场景防死循环） */
export const DEFAULT_MAX_RETRIEVALS = 5

/** LangGraph 引擎灰度开关：true 启用新 StateGraph 引擎 */
export function isLangGraphChatEnabled(): boolean {
  const raw = process.env.AI_CHAT_USE_LANGGRAPH?.trim().toLowerCase()
  return raw === 'true' || raw === '1' || raw === 'yes' || raw === 'on'
}

/** 默认检索返回条数 */
export const DEFAULT_RAG_LIMIT = 6

/** 最低 citation score 阈值：低于该值的 citation 不送入 LLM */
export const DEFAULT_MIN_ACCEPTED_CITATION_SCORE = 0.1
