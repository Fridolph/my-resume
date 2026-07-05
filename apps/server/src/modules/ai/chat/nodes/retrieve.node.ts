import { Logger } from '@nestjs/common'
import type { RunnableConfig } from '@langchain/core/runnables'

import type { ResumePublicationService } from '../../../resume/application/services/resume-publication.service'
import type { RagKnowledgeDomain } from '../../rag/rag-knowledge-domain'
import type { RagService } from '../../rag/rag.service'
import type { RagRetrievalSourceType, RagSearchMatch } from '../../rag/rag.types'
import type { GraphSearchService } from '../../graph/graph-search.service'
import type { AiChatLocale } from '../ai-chat.types'
import { DEFAULT_MIN_ACCEPTED_CITATION_SCORE, DEFAULT_RAG_LIMIT } from '../ai-chat-graph.constants'

const logger = new Logger('RetrieveNode')

function mergeUnique(existing: RagSearchMatch[], incoming: RagSearchMatch[]): RagSearchMatch[] {
  const map = new Map<string, RagSearchMatch>()
  for (const doc of existing) map.set(doc.id, doc)
  for (const doc of incoming) {
    const prev = map.get(doc.id)
    if (!prev || doc.score > prev.score) map.set(doc.id, doc)
  }
  return [...map.values()]
}

export function createRetrieveNode(
  ragService: RagService,
  resumePublicationService: ResumePublicationService,
  graphSearchService?: GraphSearchService,
) {
  return async (
    state: {
      question: string
      locale: AiChatLocale
      knowledgeDomains: RagKnowledgeDomain[]
      sourceTypes?: RagRetrievalSourceType[]
      preferSourceTypes?: RagRetrievalSourceType[]
      subQuestions?: string[]
      nextSubIdx?: number
      documents?: any[]
      retrievalCount?: number
    },
    config?: RunnableConfig,
  ) => {
    const onToken = (config?.configurable as Record<string, unknown>)?.onToken as
      | ((token: string) => void)
      | undefined

    const subQuestions = state.subQuestions
    const idx = state.nextSubIdx ?? 0
    const query =
      subQuestions && subQuestions.length > 0 && idx < subQuestions.length
        ? subQuestions[idx]
        : state.question

    // ── RAG 检索（主路径） ──
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
        onToken,
      },
    )

    // ── Graph 检索（辅助路径，并行，容错降级） ──
    let graphMatches: RagSearchMatch[] = []
    if (graphSearchService) {
      try {
        const graphResults = await graphSearchService.search(query)
        if (graphResults.length > 0) {
          // 将 GraphSearchResult 转为 RagSearchMatch 格式
          graphMatches = graphResults.map((r) => ({
            id: `graph:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
            documentId: undefined,
            title: '知识图谱',
            section: 'graph',
            content: r.text,
            sourceType: 'graph' as any,
            sourcePath: undefined,
            score: r.score,
          }))
          logger.log({
            event: 'graph.retrieve.done',
            query: query.slice(0, 80),
            graphMatchCount: graphMatches.length,
          })
        }
      } catch (error) {
        // 图检索失败不中断主流程
        logger.warn({
          event: 'graph.retrieve.failed',
          query: query.slice(0, 80),
          message: (error as Error).message,
        })
      }
    }

    // ── 合并 RAG + Graph 结果 ──
    const nextSubIdx = subQuestions ? idx + 1 : idx
    const mergedDocuments = mergeUnique(
      mergeUnique(state.documents ?? [], result.matches),
      graphMatches,
    )

    logger.log({
      event: 'graph.retrieve.done',
      query,
      ragCitationCount: result.citations.length,
      graphMatchCount: graphMatches.length,
      totalDocuments: mergedDocuments.length,
      retrievalCount: (state.retrievalCount ?? 0) + 1,
      nextSubIdx,
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
