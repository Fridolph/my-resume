import { mkdtempSync, rmSync, writeFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { afterEach, describe, expect, it } from 'vitest'

import { JsonSnapshotRagVectorStoreAdapter } from '../../vector-store/adapters/json-snapshot.adapter'

describe('JsonSnapshotRagVectorStoreAdapter', () => {
  let tempDirectory: string | null = null

  afterEach(() => {
    if (tempDirectory) {
      rmSync(tempDirectory, { recursive: true, force: true })
      tempDirectory = null
    }
  })

  it('should search snapshot chunks and respect source filters', async () => {
    tempDirectory = mkdtempSync(join(tmpdir(), 'rag-snapshot-'))
    const snapshotPath = join(tempDirectory, 'snapshot.json')
    writeFileSync(
      snapshotPath,
      JSON.stringify({
        exportedAt: '2026-06-11T10:00:00.000Z',
        chunkCount: 2,
        chunks: [
          {
            id: 'user-doc:1',
            documentId: 'user-doc',
            sourceType: 'user_docs',
            sourceScope: 'published',
            sourceVersion: 'upload:1',
            section: 'user_docs',
            content: 'Dao 核心原理是关于系统性思考的补充资料。',
            embedding: [1, 0, 0],
            metadataJson: {
              knowledgeDomain: 'writing_media',
            },
          },
          {
            id: 'resume:1',
            documentId: 'resume-doc',
            sourceType: 'resume_core',
            sourceScope: 'published',
            sourceVersion: 'resume:1',
            section: 'experiences',
            content: '简历核心经历',
            embedding: [0, 1, 0],
            metadataJson: {
              knowledgeDomain: 'experience',
            },
          },
        ],
      }),
    )

    const adapter = new JsonSnapshotRagVectorStoreAdapter({
      path: snapshotPath,
    })

    const matches = await adapter.search({
      queryVector: [1, 0, 0],
      limit: 3,
      sourceScope: 'published',
      sourceTypes: ['user_docs'],
      knowledgeDomains: ['writing_media'],
    })

    expect(matches).toHaveLength(1)
    expect(matches[0]).toEqual(
      expect.objectContaining({
        id: 'user-doc:1',
        sourceType: 'user_docs',
        score: 1,
      }),
    )
  })
})
