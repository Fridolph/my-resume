import { describe, expect, it } from 'vitest'

import { mapLegacySourceTypeToRetrievalSourceType } from '../rag.types'

describe('rag.types', () => {
  it('should map legacy resume source to resume_core retrieval source', () => {
    expect(mapLegacySourceTypeToRetrievalSourceType('resume')).toBe('resume_core')
  })

  it('should map legacy knowledge source to user_docs retrieval source', () => {
    expect(mapLegacySourceTypeToRetrievalSourceType('knowledge')).toBe('user_docs')
  })

  it('should keep retrieval source type stable when source is already normalized', () => {
    expect(mapLegacySourceTypeToRetrievalSourceType('resume_core')).toBe('resume_core')
    expect(mapLegacySourceTypeToRetrievalSourceType('user_docs')).toBe('user_docs')
  })
})
