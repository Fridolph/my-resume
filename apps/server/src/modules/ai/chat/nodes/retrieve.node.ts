import { Logger } from '@nestjs/common'

import type { ResumePublicationService } from '../../../resume/application/services/resume-publication.service'
import type { RagKnowledgeDomain } from '../../rag/rag-knowledge-domain'
import type { RagService } from '../../rag/rag.service'
import type { RagRetrievalSourceType, RagSearchMatch } from '../../rag/rag.types'
import type { AiChatLocale } from '../ai-chat.types'
import { DEFAULT_MIN_ACCEPTED_CITATION_SCORE, DEFAULT_RAG_LIMIT } from '../ai-chat-graph.constants'

const logger = new Logger('RetrieveNode')

/**
 * 按 id 去重，保留更高 score 的条目。
 *
 * 多跳检索不同轮次可能召回同一文档的不同 chunk，
 * mergeUnique 确保最终 context 无重复。
 */
function mergeUnique(existing: RagSearchMatch[], incoming: RagSearchMatch[]): RagSearchMatch[] {
  const map = new Map<string, RagSearchMatch>()

  for (const doc of existing) {
    map.set(doc.id, doc)
  }

  for (const doc of incoming) {
    const prev = map.get(doc.id)
    if (!prev || doc.score > prev.score) {
      map.set(doc.id, doc)
    }
  }

  return [...map.values()]
}

/**
 * retrieve 节点工厂。
 *
 * 调用 RagService.ask() 执行检索 + RAG 生成。
 * 返回 matches + citations + answer，供后续 evaluate 节点判断。
 *
 * M31 多跳扩展点：当 subQuestions 非空时，按 nextSubIdx 取子问题检索。
 */
export function createRetrieveNode(
  ragService: RagService,
  resumePublicationService: ResumePublicationService,
) {
  return async (state: {
    question: string
    locale: AiChatLocale
    knowledgeDomains: RagKnowledgeDomain[]
    sourceTypes?: RagRetrievalSourceType[]
    preferSourceTypes?: RagRetrievalSourceType[]
    subQuestions?: string[]
    nextSubIdx?: number
    documents?: any[]
    retrievalCount?: number
  }) => {
    // 多跳模式：取当前游标对应的子问题，否则直接用原始问题
    const subQuestions = state.subQuestions
    const idx = state.nextSubIdx ?? 0
    const query =
      subQuestions && subQuestions.length > 0 && idx < subQuestions.length
        ? subQuestions[idx]
        : state.question

    const result = await ragService.ask(
      query,
      DEFAULT_RAG_LIMIT,
      state.locale,
      {
        knowledgeDomains: state.knowledgeDomains,
        sourceTypes: state.sourceTypes,
        preferSourceTypes: state.preferSourceTypes,
      },
      {
        minAcceptedCitationScore: DEFAULT_MIN_ACCEPTED_CITATION_SCORE,
      },
    )

    // 多跳模式：游标 +1，合并去重
    const nextSubIdx = subQuestions ? idx + 1 : idx
    const mergedDocuments = mergeUnique(state.documents ?? [], result.matches)

    logger.log({
      event: 'graph.retrieve.done',
      query,
      citationCount: result.citations.length,
      topCitationScore: result.citations[0]?.score ?? 0,
      retrievalCount: (state.retrievalCount ?? 0) + 1,
      nextSubIdx,
      totalDocuments: mergedDocuments.length,
    })

    return {
      documents: mergedDocuments,
      citations: result.citations,
      answer: result.answer,
      retrievalCount: (state.retrievalCount ?? 0) + 1,
      nextSubIdx,
    }
  }
}
