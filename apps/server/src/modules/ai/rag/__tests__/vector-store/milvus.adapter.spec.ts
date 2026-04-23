import { describe, expect, it } from 'vitest'

import { MilvusRagVectorStoreAdapter } from '../../vector-store/adapters/milvus.adapter'

function createAdapter(mode: 'mock' | 'sdk' = 'mock') {
  return new MilvusRagVectorStoreAdapter({
    mode,
    address: 'http://127.0.0.1:19530',
    database: 'default',
    collection: 'resume_rag_chunks',
    vectorDimension: 4,
  })
}

describe('MilvusRagVectorStoreAdapter', () => {
  it('should upsert and search chunks in mock mode', async () => {
    const adapter = createAdapter()

    await adapter.upsertChunks([
      {
        id: 'chunk-1',
        documentId: 'doc-a',
        sourceType: 'user_docs',
        sourceScope: 'draft',
        sourceVersion: 'upload:1',
        section: 'user_docs',
        content: 'Vue RAG practice notes',
        embedding: [1, 0, 0, 0],
      },
      {
        id: 'chunk-2',
        documentId: 'doc-a',
        sourceType: 'user_docs',
        sourceScope: 'draft',
        sourceVersion: 'upload:1',
        section: 'user_docs',
        content: 'Milvus indexing baseline',
        embedding: [0.8, 0.2, 0, 0],
      },
      {
        id: 'chunk-3',
        documentId: 'doc-b',
        sourceType: 'user_docs',
        sourceScope: 'published',
        sourceVersion: 'upload:2',
        section: 'user_docs',
        content: 'Other document',
        embedding: [0, 1, 0, 0],
      },
    ])

    const matches = await adapter.search({
      queryVector: [1, 0, 0, 0],
      limit: 2,
      sourceType: 'user_docs',
      sourceScope: 'draft',
    })

    expect(matches).toHaveLength(2)
    expect(matches[0]?.id).toBe('chunk-1')
    expect(matches[0]?.score).toBeGreaterThan(matches[1]?.score ?? 0)
  })

  it('should delete chunks by document id in mock mode', async () => {
    const adapter = createAdapter()

    await adapter.upsertChunks([
      {
        id: 'chunk-1',
        documentId: 'doc-a',
        sourceType: 'user_docs',
        sourceScope: 'draft',
        sourceVersion: 'upload:1',
        section: 'user_docs',
        content: 'A',
        embedding: [1, 0, 0, 0],
      },
      {
        id: 'chunk-2',
        documentId: 'doc-b',
        sourceType: 'user_docs',
        sourceScope: 'draft',
        sourceVersion: 'upload:2',
        section: 'user_docs',
        content: 'B',
        embedding: [0, 1, 0, 0],
      },
    ])
    await adapter.deleteChunksByDocument('doc-a')

    const matches = await adapter.search({
      queryVector: [1, 0, 0, 0],
      limit: 5,
    })

    expect(matches).toHaveLength(1)
    expect(matches[0]?.id).toBe('chunk-2')
  })

  it('should fail fast in sdk mode during skeleton stage', async () => {
    const adapter = createAdapter('sdk')

    await expect(
      adapter.search({
        queryVector: [1, 0, 0, 0],
        limit: 1,
      }),
    ).rejects.toThrow('Milvus SDK mode is not implemented yet')
  })
})
