#!/usr/bin/env node

/**
 * 从 Milvus 导出的 JSONL 导入到 SQLite rag_documents 和 rag_chunks 表。
 *
 * 使用方式:
 *   pnpm --filter @my-resume/server rag:import:resume
 *   pnpm --filter @my-resume/server rag:import:resume --file .data/resume_profile_chunks.jsonl
 *
 * 每行 JSON 结构:
 *   { id, section, subsection_key, subsection_title, entity_type,
 *     content, vector, tags, source_id, locale, chunk_index, chunk_count }
 */

import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { createReadStream } from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const SCRIPT_DIR = path.dirname(__filename)
const REPO_ROOT = path.resolve(SCRIPT_DIR, '../../..')
const DB_PATH = path.join(REPO_ROOT, '.data', 'my-resume.db')
const DEFAULT_INPUT = path.join(REPO_ROOT, '.data', 'resume_profile_chunks.jsonl')

// ── helpers ──────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = { file: '' }
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--file') {
      args.file = argv[++i]
    }
  }
  return args
}

function computeHash(content) {
  return createHash('sha256').update(content).digest('hex')
}

function escapeSql(value) {
  return String(value).replace(/'/g, "''")
}

/** 执行一条 SQL，不回滚失败 */
function runSql(sql) {
  try {
    execFileSync('sqlite3', [DB_PATH], {
      input: sql + ';\n',
      stdio: ['pipe', 'ignore', 'pipe'],
      timeout: 5000,
    })
    return true
  } catch (error) {
    const stderr = error.stderr ? error.stderr.toString() : ''
    if (stderr && !stderr.includes('UNIQUE constraint')) {
      console.error(`  sqlite3 error: ${stderr.trim()}`)
    }
    return false
  }
}

async function* readJsonlLines(filePath) {
  const stream = createReadStream(filePath, 'utf8')
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity })

  for await (const line of rl) {
    const trimmed = line.trim()
    if (!trimmed) continue
    try {
      yield JSON.parse(trimmed)
    } catch (error) {
      console.error(`WARNING: skip invalid JSON: ${error.message}`)
    }
  }
}

// ── main ─────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv)
  const inputPath = args.file || DEFAULT_INPUT

  if (!existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`)
    process.exit(1)
  }

  console.log(`Reading: ${inputPath}`)

  // 1. 解析所有 chunk
  /** @type {Array<Record<string, unknown>>} */
  const chunks = []

  for await (const record of readJsonlLines(inputPath)) {
    chunks.push(record)
  }

  console.log(`Parsed ${chunks.length} chunks`)

  if (chunks.length === 0) {
    console.error('No chunks to import.')
    process.exit(1)
  }

  // 2. 构建文档记录
  const sourceId = String(chunks[0].source_id || 'fuyinsheng-resume-zh')
  const locale = String(chunks[0].locale || 'zh')
  const docId = computeHash(`resume_core:published:${sourceId}:${locale}`)
  const now = Date.now()
  const contentHash = computeHash(
    chunks.map((c) => String(c.content || '')).join('\n'),
  )

  console.log(`Target DB: ${DB_PATH}`)

  if (!existsSync(DB_PATH)) {
    console.error(`DB file does not exist: ${DB_PATH}`)
    process.exit(1)
  }

  // 3. Upsert 文档 & 清除旧 chunk
  const metadataJson = escapeSql(JSON.stringify({
    importedFrom: 'milvus',
    totalChunks: chunks.length,
    importedAt: new Date().toISOString(),
  }))

  runSql(`INSERT OR REPLACE INTO rag_documents
    (id, source_type, source_scope, source_id, source_version,
     locale, title, content_hash, metadata_json, created_at, updated_at)
    VALUES ('${docId}', 'resume_core', 'published', '${escapeSql(sourceId)}',
     'milvus-import:${new Date().toISOString().slice(0, 10)}', '${locale}',
     '${locale === "zh" ? "简历核心数据" : "Resume core data"} - ${escapeSql(sourceId)}', '${contentHash}', '${metadataJson}', ${now}, ${now})`)

  runSql(`DELETE FROM rag_chunks WHERE document_id = '${docId}'`)

  // 4. 逐条插入
  let inserted = 0

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    const embedding = Array.isArray(chunk.vector) ? chunk.vector : []
    const metaJson = escapeSql(JSON.stringify({
      source_id: String(chunk.source_id || ''),
      locale: String(chunk.locale || 'zh'),
      subsection_key: String(chunk.subsection_key || ''),
      subsection_title: String(chunk.subsection_title || ''),
      entity_type: String(chunk.entity_type || ''),
      tags: Array.isArray(chunk.tags) ? chunk.tags : [],
    }))

    const sql = `INSERT OR REPLACE INTO rag_chunks
      (id, document_id, chunk_index, section, content,
       content_hash, embedding_json, metadata_json,
       created_at, updated_at)
      VALUES ('${escapeSql(String(chunk.id || ''))}', '${docId}', ${i},
       '${escapeSql(String(chunk.section || chunk.subsection_key || ''))}',
       '${escapeSql(String(chunk.content || ''))}',
       '${computeHash(String(chunk.content || ''))}',
       '${escapeSql(JSON.stringify(embedding))}',
       '${metaJson}',
       ${now}, ${now})`

    if (runSql(sql)) {
      inserted += 1
    } else {
      console.error(`  skip chunk ${i} (${String(chunk.id || '').slice(0, 40)})`)
    }
  }

  console.log(`Inserted ${inserted}/${chunks.length} chunks`)
  console.log('Done.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
