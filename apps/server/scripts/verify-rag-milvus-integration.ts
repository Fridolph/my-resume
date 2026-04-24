import { randomUUID } from 'node:crypto'

import { resolveRagVectorStoreRuntimeConfig } from '../src/modules/ai/rag/vector-store/config'
import { MilvusRagVectorStoreAdapter } from '../src/modules/ai/rag/vector-store/adapters/milvus.adapter'

function requireIntegrationFlag(): boolean {
  const flag = process.env.RUN_MILVUS_INTEGRATION?.trim().toLowerCase()

  if (flag === '1' || flag === 'true' || flag === 'yes') {
    return true
  }

  console.error(
    [
      '[milvus-integration] skipped: set RUN_MILVUS_INTEGRATION=1 to run.',
      'Example:',
      'RUN_MILVUS_INTEGRATION=1 pnpm --filter @my-resume/server rag:milvus:verify',
    ].join('\n'),
  )

  return false
}

function createUnitVector(vectorDimension: number, hotIndex: number): number[] {
  const vector = Array.from({ length: vectorDimension }, () => 0)
  const index = Math.max(0, Math.min(hotIndex, vectorDimension - 1))

  vector[index] = 1

  return vector
}

async function main() {
  const shouldRun = requireIntegrationFlag()

  if (!shouldRun) {
    return
  }

  const runtimeConfig = resolveRagVectorStoreRuntimeConfig({
    ...process.env,
    RAG_VECTOR_STORE_BACKEND: 'milvus',
    RAG_MILVUS_MODE: 'sdk',
  })

  if (runtimeConfig.backend !== 'milvus') {
    throw new Error('Milvus backend config is required')
  }

  const adapter = new MilvusRagVectorStoreAdapter(runtimeConfig.milvus)
  const sourceId = randomUUID()
  const documentId = `integration-doc:${sourceId}`

  const chunks = [
    {
      id: `integration-chunk:${sourceId}:1`,
      documentId,
      sourceType: 'user_docs' as const,
      sourceScope: 'published' as const,
      sourceVersion: `integration:${Date.now()}`,
      section: 'user_docs',
      content: 'Milvus integration check: Vue3 + TypeScript + RAG.',
      embedding: createUnitVector(runtimeConfig.milvus.vectorDimension, 0),
      metadataJson: {
        fileName: 'integration-notes.md',
        scenario: 'milvus-step4-3',
      },
    },
    {
      id: `integration-chunk:${sourceId}:2`,
      documentId,
      sourceType: 'user_docs' as const,
      sourceScope: 'published' as const,
      sourceVersion: `integration:${Date.now()}`,
      section: 'user_docs',
      content: 'Milvus integration check: NestJS module architecture.',
      embedding: createUnitVector(runtimeConfig.milvus.vectorDimension, 1),
      metadataJson: {
        fileName: 'integration-architecture.md',
        scenario: 'milvus-step4-3',
      },
    },
  ]

  try {
    await adapter.deleteChunksByDocument(documentId)
    await adapter.upsertChunks(chunks)

    const matches = await adapter.search({
      queryVector: createUnitVector(runtimeConfig.milvus.vectorDimension, 0),
      limit: 3,
      sourceType: 'user_docs',
      sourceScope: 'published',
    })

    console.log('[milvus-integration] top matches:')
    console.table(
      matches.map((item) => ({
        id: item.id,
        score: item.score,
        section: item.section,
        sourceScope: item.sourceScope,
        sourceType: item.sourceType,
        content: item.content.slice(0, 60),
      })),
    )

    if (matches.length === 0) {
      throw new Error('No matches returned from Milvus search')
    }

    console.log('[milvus-integration] success: upsert + search path is working.')
  } finally {
    await adapter.deleteChunksByDocument(documentId)
  }
}

main().catch((error) => {
  console.error('[milvus-integration] failed:', error)
  process.exit(1)
})
