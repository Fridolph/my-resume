import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import {
  compareUserDocChunkingStrategies,
  USER_DOC_CHUNKING_STRATEGIES,
} from '../src/modules/ai/rag/user-doc-chunking'

interface CliRow {
  file: string
  strategy: string
  sourceChars: number
  chunkCount: number
  avgChunkChars: number
  totalChunkChars: number
  redundantChars: number
  redundancyRatio: string
}

const targets = process.argv.slice(2)

if (targets.length === 0) {
  console.error('Usage: pnpm --filter @my-resume/server rag:chunk:compare <file1> [file2 ...]')
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
  const summaries = compareUserDocChunkingStrategies(text, USER_DOC_CHUNKING_STRATEGIES)
  processedCount += 1

  for (const summary of summaries) {
    rows.push({
      file: absolutePath,
      strategy: summary.label,
      sourceChars: summary.sourceChars,
      chunkCount: summary.chunkCount,
      avgChunkChars: Number(summary.avgChunkChars.toFixed(1)),
      totalChunkChars: summary.totalChunkChars,
      redundantChars: summary.redundantChars,
      redundancyRatio: `${(summary.redundancyRatio * 100).toFixed(2)}%`,
    })
  }
}

if (processedCount === 0) {
  console.error('No readable files to compare.')
  process.exit(1)
}

console.log('\nuser_docs chunking strategy baseline (500/50 vs 1000/100)\n')
console.table(rows)
