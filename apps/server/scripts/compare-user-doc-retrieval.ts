import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { evaluateUserDocRetrievalByProfiles } from '../src/modules/ai/rag/user-doc-retrieval-evaluator'

interface CliRow {
  file: string
  profile: string
  chunkSize: number
  chunkOverlap: number
  chunkCount: number
  hitChunkCount: number
  topScore: number
  avgTopScore: number
  topChunk: string
}

const args = process.argv.slice(2)
const query = args[0]
const targets = args.slice(1)

if (!query || targets.length === 0) {
  console.error(
    'Usage: pnpm --filter @my-resume/server rag:retrieval:compare "<query>" <file1> [file2 ...]',
  )
  process.exit(1)
}

const rows: CliRow[] = []
let processedCount = 0

for (const targetPath of targets) {
  const absolutePath = resolve(process.cwd(), targetPath)

  if (!existsSync(absolutePath)) {
    console.warn(`Skip missing file: ${absolutePath}`)
    continue
  }

  const text = readFileSync(absolutePath, 'utf8')
  const summaries = evaluateUserDocRetrievalByProfiles({
    text,
    query,
    limit: 3,
  })
  processedCount += 1

  for (const summary of summaries) {
    const topChunk = summary.topMatches[0]?.content ?? ''
    const preview = topChunk.replace(/\s+/g, ' ').slice(0, 48)

    rows.push({
      file: absolutePath,
      profile: summary.profile,
      chunkSize: summary.chunkSize,
      chunkOverlap: summary.chunkOverlap,
      chunkCount: summary.chunkCount,
      hitChunkCount: summary.hitChunkCount,
      topScore: summary.topScore,
      avgTopScore: summary.avgTopScore,
      topChunk: preview,
    })
  }
}

if (processedCount === 0) {
  console.error('No readable files to compare.')
  process.exit(1)
}

console.log('\nuser_docs retrieval profile comparison (keyword baseline)\n')
console.log(`query: ${query}\n`)
console.table(rows)
