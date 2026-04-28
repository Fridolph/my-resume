import { evaluateResumeRagRetrieval } from '../src/modules/resume/application/services/resume-rag-retrieval-evaluator'
import { buildResumeRagSemanticChunks } from '../src/modules/resume/application/services/resume-rag-semantic-chunking'
import { ResumeMarkdownExportService } from '../src/modules/resume/application/services/resume-markdown-export.service'
import {
  createExampleStandardResume,
  type ResumeLocale,
} from '../src/modules/resume/domain/standard-resume'

interface CliRow {
  rank: number
  section: string
  entityType: string
  title: string
  score: number
  preview: string
}

function resolveLocale(value: string | undefined): ResumeLocale {
  if (value === 'en' || value === 'zh') {
    return value
  }

  return 'zh'
}

const args = process.argv.slice(2)
const query = args[0]
const locale = resolveLocale(args[1])

if (!query) {
  console.error(
    'Usage: pnpm --filter @my-resume/server rag:resume:retrieval:compare "<query>" [zh|en]',
  )
  process.exit(1)
}

const resume = createExampleStandardResume()
const markdownExportService = new ResumeMarkdownExportService()
const fullText = markdownExportService.render(resume, locale)
const semanticChunks = buildResumeRagSemanticChunks(resume, locale)
const evaluation = evaluateResumeRagRetrieval({
  query,
  fullText,
  semanticChunks,
  limit: 5,
})

const rows: CliRow[] = evaluation.topMatches.map((match, index) => ({
  rank: index + 1,
  section: match.section,
  entityType: match.entityType,
  title: match.title,
  score: match.score,
  preview: match.content.replace(/\s+/g, ' ').slice(0, 72),
}))

console.log('\nresume_core semantic retrieval comparison (keyword baseline)\n')
console.log(`query: ${evaluation.query}`)
console.log(`locale: ${locale}`)
console.log(`fullTextScore: ${evaluation.fullTextScore}`)
console.log(`semanticChunkCount: ${evaluation.semanticChunkCount}`)
console.log(`hitChunkCount: ${evaluation.hitChunkCount}`)
console.log(`hitSections: ${JSON.stringify(evaluation.hitSections)}\n`)
console.table(rows)
