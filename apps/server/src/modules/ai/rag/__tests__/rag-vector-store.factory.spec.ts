import { describe, expect, it } from 'vitest'

import { createRagVectorStore } from '../rag-vector-store.factory'

describe('createRagVectorStore', () => {
  it('should create local adapter', () => {
    const store = createRagVectorStore({
      backend: 'local',
    })

    expect(store.backend).toBe('local')
  })

  it('should create milvus adapter', () => {
    const store = createRagVectorStore({
      backend: 'milvus',
      milvus: {
        mode: 'mock',
        address: 'http://127.0.0.1:19530',
        database: 'default',
        collection: 'resume_rag_chunks',
        vectorDimension: 1536,
      },
    })

    expect(store.backend).toBe('milvus')
  })
})
