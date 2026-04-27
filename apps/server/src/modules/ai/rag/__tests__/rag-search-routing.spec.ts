import { describe, expect, it } from 'vitest'

import {
  mergeRagSearchRoutingConfig,
  resolveRagSearchRoutingConfig,
} from '../rag-search-routing'

describe('resolveRagSearchRoutingConfig', () => {
  it('should use safe defaults', () => {
    const config = resolveRagSearchRoutingConfig({})

    expect(config).toEqual({
      useVectorStore: false,
      vectorScope: 'published',
      fallbackToLocal: true,
    })
  })

  it('should parse vector routing flags from env', () => {
    const config = resolveRagSearchRoutingConfig({
      RAG_SEARCH_USE_VECTOR_STORE: 'true',
      RAG_SEARCH_VECTOR_SCOPE: 'draft',
      RAG_SEARCH_VECTOR_FALLBACK_TO_LOCAL: 'false',
    })

    expect(config).toEqual({
      useVectorStore: true,
      vectorScope: 'draft',
      fallbackToLocal: false,
    })
  })

  it('should throw for unsupported scope', () => {
    expect(() =>
      resolveRagSearchRoutingConfig({
        RAG_SEARCH_VECTOR_SCOPE: 'team',
      }),
    ).toThrow('Unsupported RAG_SEARCH_VECTOR_SCOPE: team')
  })

  it('should merge request override on top of defaults', () => {
    const merged = mergeRagSearchRoutingConfig(
      {
        useVectorStore: false,
        vectorScope: 'published',
        fallbackToLocal: true,
      },
      {
        useVectorStore: true,
        vectorScope: 'draft',
      },
    )

    expect(merged).toEqual({
      useVectorStore: true,
      vectorScope: 'draft',
      fallbackToLocal: true,
    })
  })
})
