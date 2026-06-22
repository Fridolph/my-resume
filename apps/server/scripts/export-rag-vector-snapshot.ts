import { mkdirSync, writeFileSync } from 'fs'
import { dirname, resolve } from 'path'

import { eq } from 'drizzle-orm'

import { createDatabase, createDatabaseClient } from '../src/database/database.client'
import { resolveDatabaseConfig } from '../src/database/database.config'
import { ragChunks, ragDocuments } from '../src/database/schema'
import { resolveRepoRoot } from '../src/config/repo-root'
import type { RagVectorSnapshotFile } from '../src/modules/ai/rag/vector-store/types'

async function main() {
  const repoRoot = resolveRepoRoot(__dirname)
  const databaseConfig = resolveDatabaseConfig(process.env, repoRoot)
  const databaseClient = createDatabaseClient(databaseConfig)
  const database = createDatabase(databaseClient)
  const outputPath =
    process.argv[2] ||
    process.env.RAG_VECTOR_SNAPSHOT_PATH ||
    resolve(repoRoot, '.data', 'rag-vector-snapshot.json')

  const rows = await database
    .select({
      chunkId: ragChunks.id,
      documentId: ragChunks.documentId,
      section: ragChunks.section,
      content: ragChunks.content,
      embeddingJson: ragChunks.embeddingJson,
      metadataJson: ragChunks.metadataJson,
      documentSourceType: ragDocuments.sourceType,
      documentSourceScope: ragDocuments.sourceScope,
      documentSourceVersion: ragDocuments.sourceVersion,
      documentMetadataJson: ragDocuments.metadataJson,
    })
    .from(ragChunks)
    .innerJoin(ragDocuments, eq(ragChunks.documentId, ragDocuments.id))

  const snapshot: RagVectorSnapshotFile = {
    exportedAt: new Date().toISOString(),
    chunkCount: rows.length,
    chunks: rows.map((row) => ({
      id: row.chunkId,
      documentId: row.documentId,
      sourceType: row.documentSourceType,
      sourceScope: row.documentSourceScope,
      sourceVersion: row.documentSourceVersion,
      section: row.section,
      content: row.content,
      embedding: row.embeddingJson ?? [],
      metadataJson:
        row.metadataJson && typeof row.metadataJson === 'object'
          ? {
              ...(row.documentMetadataJson && typeof row.documentMetadataJson === 'object'
                ? row.documentMetadataJson
                : {}),
              ...row.metadataJson,
            }
          : row.documentMetadataJson && typeof row.documentMetadataJson === 'object'
            ? row.documentMetadataJson
            : null,
    })),
  }

  mkdirSync(dirname(outputPath), { recursive: true })
  writeFileSync(outputPath, JSON.stringify(snapshot, null, 2))
  await databaseClient.close()

  console.log(
    `[rag-snapshot] exported ${snapshot.chunkCount} chunks to ${outputPath}`,
  )
}

main().catch((error) => {
  console.error('[rag-snapshot] failed:', error)
  process.exitCode = 1
})
