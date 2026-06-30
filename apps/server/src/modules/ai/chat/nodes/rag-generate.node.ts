import type { AiChatMessageBlock } from '../ai-chat.types'

/**
 * rag_generate 节点。
 *
 * 当前版本（M30 Issue 2）：直接透传 RagService.ask() 的结果。
 * RagService.ask() 内部已完成 检索+生成 全链路，此处只做格式化。
 *
 * M30 Issue 3 扩展点：evaluate 节点插入在本节点之前，
 * 根据评估结果决定走 rag_generate 还是 fallback_answer。
 */
export function createRagGenerateNode() {
  return async (state: {
    answer: string
    citations: any[]
  }) => {
    // 透传 already-generated answer（来自 RagService.ask()）
    const answer = state.answer || ''

    const blocks: AiChatMessageBlock[] = [
      {
        type: 'text',
        text: answer,
      },
    ]

    return {
      answer,
      blocks,
    }
  }
}
