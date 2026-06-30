import { Logger } from '@nestjs/common'
import type { RunnableConfig } from '@langchain/core/runnables'

import type { ResumePublicationService } from '../../../resume/application/services/resume-publication.service'
import type { RagKnowledgeDomain } from '../../rag/rag-knowledge-domain'
import type { RagService } from '../../rag/rag.service'
import type { RagRetrievalSourceType, RagSearchMatch } from '../../rag/rag.types'
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
