import { describe, expect, it } from 'vitest'

import { resolveRagVectorStoreRuntimeConfig } from '../rag-vector-store.config'

describe('resolveRagVectorStoreRuntimeConfig', () => {
  it('should use local backend by default', () => {
    const config = resolveRagVectorStoreRuntimeConfig({})

    expect(config).toEqual({
      backend: 'local',
    })
  })

  it('should resolve milvus mock runtime config from env', () => {
    const config = resolveRagVectorStoreRuntimeConfig({
      RAG_VECTOR_STORE_BACKEND: 'milvus',
      RAG_MILVUS_MODE: 'mock',
      RAG_MILVUS_ADDRESS: 'http://127.0.0.1:19530',
      RAG_MILVUS_DATABASE: 'resume_test',
      RAG_MILVUS_COLLECTION: 'user_docs_vectors',
      RAG_MILVUS_VECTOR_DIMENSION: '1024',
      RAG_MILVUS_TOKEN: 'root:milvus',
    })

    expect(config).toEqual({
      backend: 'milvus',
      milvus: {
        mode: 'mock',
        address: 'http://127.0.0.1:19530',
        database: 'resume_test',
        collection: 'user_docs_vectors',
        vectorDimension: 1024,
        token: 'root:milvus',
      },
    })
  })

  it('should throw for unsupported backend', () => {
    expect(() =>
      resolveRagVectorStoreRuntimeConfig({
        RAG_VECTOR_STORE_BACKEND: 'faiss',
      }),
    ).toThrow('Unsupported RAG_VECTOR_STORE_BACKEND: faiss')
  })
})
