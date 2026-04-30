import { createHash } from 'node:crypto'
import { createReadStream, existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import readline from 'node:readline'

// ═══════════════════════════════════════════════════════════════════
// 从 Milvus 导出的 JSONL 文件（resume_profile_chunks.jsonl）导入到
// SQLite rag_documents 和 rag_chunks 表。
//
// 使用方式：
//   pnpm --filter @my-resume/server rag:import:resume
//   pnpm --filter @my-resume/server rag:import:resume --file .data/resume_profile_chunks.jsonl
//
// 每行 JSON 结构：
//   { id, section, subsection_key, subsection_title, entity_type,
//     content, vector, tags, source_id, locale, chunk_index, chunk_count }
// ═══════════════════════════════════════════════════════════════════

const REPO_ROOT = path.resolve(import.meta.dirname, '../../..')

function resolveInputPath(userPath) {
  return userPath ?? path.resolve(REPO_ROOT, '.data', 'resume_profile_chunks.jsonl')
}

function resolveDbPath() {
  const url = process.env.DATABASE_URL || 'file:.data/my-resume.db'
  return url.replace(/^file:/, '')
}

function computeContentHash(content) {
  return createHash('sha256').update(content).digest('hex')
}

function parseArgs(argv) {
  const args = { _: [] }
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--file') {
      args.file = argv[++i]
    } else if (!argv[i].startsWith('--')) {
      args._.push(argv[i])
    }
  }
  return args
}

async function* readJsonlLines(filePath) {
  const stream = createReadStream(filePath, 'utf8')
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity })

  let lineNumber = 0
  for await (const line of rl) {
    lineNumber += 1
    const trimmed = line.trim()

    if (!trimmed) continue

    try {
      const record = JSON.parse(trimmed)
      yield record
    } catch (error) {
      console.error(`WARNING: skip invalid JSON at line ${lineNumber}: ${error.message}`)
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
async function main() {
  const args = parseArgs(process.argv)
  const inputPath = resolveInputPath(args.file)

  if (!existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`)
    process.exit(1)
  }

  console.log(`Reading: ${inputPath}`)

  // 第一遍扫描：收集文档级元数据
  const chunks = []
  let totalLines = 0

  for await (const record of readJsonlLines(inputPath)) {
    totalLines += 1
    chunks.push({
      id: String(record.id),
      section: String(record.section || record.subsection_key || ''),
      content: String(record.content || ''),
      embedding: Array.isArray(record.vector) ? record.vector : [],
      chunkIndex: Number(record.chunk_index ?? 0),
      chunkCount: Number(record.chunk_count ?? 1),
      metadata: {
        source_id: String(record.source_id || ''),
        locale: String(record.locale || 'zh'),
        subsection_key: String(record.subsection_key || ''),
        subsection_title: String(record.subsection_title || ''),
        entity_type: String(record.entity_type || ''),
        tags: Array.isArray(record.tags) ? record.tags : [],
      },
    })
  }

  console.log(`Parsed ${totalLines} chunks`)

  // 生成文档记录
  const sourceId = chunks[0]?.metadata.source_id || 'fuyinsheng-resume-zh'
  const locale = chunks[0]?.metadata.locale || 'zh'
  const documentId = createHash('sha256')
    .update(`resume_core:published:${sourceId}:${locale}`)
    .digest('hex')
  const now = Date.now()
  const contentHash = computeContentHash(chunks.map((c) => c.id + c.content).join('\n'))

  const document = {
    id: documentId,
    source_type: 'resume_core',
    source_scope: 'published',
    source_id: sourceId,
    source_version: `milvus-import:${new Date().toISOString().slice(0, 10)}`,
    locale,
    title: '付寅生简历核心数据',
    content_hash: contentHash,
    metadata_json: JSON.stringify({
      importedFrom: 'milvus',
      totalChunks: totalLines,
      importedAt: new Date().toISOString(),
    }),
    created_at: now,
    updated_at: now,
  }

  // 输出 SQL 文件
  const sqlPath = path.resolve(REPO_ROOT, '.data', 'import-resume-chunks.sql')

  const sqlLines = []

  // INSERT OR REPLACE document
  sqlLines.push('-- 导入 resume_core 文档')
  sqlLines.push(
    `INSERT OR REPLACE INTO rag_documents (id, source_type, source_scope, source_id, source_version, locale, title, content_hash, metadata_json, created_at, updated_at) VALUES (${[
      `'${documentId}'`,
      `'resume_core'`,
      `'published'`,
      `'${sourceId}'`,
      `'${document.source_version}'`,
      `'${locale}'`,
      `'${document.title}'`,
      `'${contentHash}'`,
      `'${document.metadata_json}'`,
      now,
      now,
    ].join(', ')});`,
  )

  // DELETE old chunks for this document, then INSERT new ones
  sqlLines.push(`DELETE FROM rag_chunks WHERE document_id = '${documentId}';`)

  for (const chunk of chunks) {
    sqlLines.push(
      `INSERT INTO rag_chunks (id, document_id, chunk_index, section, content, content_hash, embedding_json, metadata_json, created_at, updated_at) VALUES (${[
        `'${chunk.id}'`,
        `'${documentId}'`,
        chunk.chunkIndex,
        `'${chunk.section}'`,
        `'${chunk.content.replace(/'/g, "''")}'`,
        `'${computeContentHash(chunk.content)}'`,
        `'${JSON.stringify(chunk.embedding)}'`,
        `'${JSON.stringify(chunk.metadata)}'`,
        now,
        now,
      ].join(', ')});`,
    )
  }

  await writeFile(sqlPath, sqlLines.join('\n') + '\n', 'utf8')
  console.log(`Written ${sqlLines.length - 2} chunk inserts + 1 document to: ${path.relative(REPO_ROOT, sqlPath)}`)

  // 执行 SQL
  const { execFileSync } = await import('node:child_process')
  const dbPath = resolveDbPath()
  const absoluteDbPath = path.resolve(REPO_ROOT, dbPath)

  console.log(`Target DB: ${absoluteDbPath}`)

  if (!existsSync(absoluteDbPath)) {
    console.log(`DB file does not exist yet: ${absoluteDbPath}`)
    console.log('Run `pnpm dev` once to create the DB, then re-run this script.')
    console.log(`Or manually run: sqlite3 ${absoluteDbPath} < ${sqlPath}`)
    return
  }

  try {
    execFileSync('sqlite3', [absoluteDbPath], {
      input: await readFile(sqlPath, 'utf8'),
      stdio: 'inherit',
    })
    console.log('Import complete!')
  } catch {
    console.log(`sqlite3 command failed. Manually run:`)
    console.log(`  sqlite3 ${absoluteDbPath} < ${sqlPath}`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
