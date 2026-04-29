import path from 'node:path'

import {
  generateReleaseEntry,
  normalizeTag,
  parseCliArgs,
  printUsageAndExit,
  resolveReleaseNotesPath,
  resolveRepoRoot,
  writeChangelogFile,
  writeReleaseNotesFile,
} from './lib.mjs'

async function main() {
  const args = parseCliArgs(process.argv.slice(2))
  const command = args._[0]

  if (!command || !['preview', 'write', 'notes'].includes(command)) {
    printUsageAndExit('Missing changelog command.')
  }

  if (!args.tag) {
    printUsageAndExit('Missing required --tag.')
  }

  const repoRoot = resolveRepoRoot()
  const targetTag = normalizeTag(args.tag)
  const toRef = args.to || 'HEAD'
  const previousTag = args.from || undefined
  const changelogPath = path.resolve(repoRoot, args.file || 'CHANGELOG.md')
  const outputPath = path.resolve(
    repoRoot,
    args.output || resolveReleaseNotesPath(repoRoot, targetTag),
  )
  const entry = generateReleaseEntry(repoRoot, {
    targetTag,
    toRef,
    previousTag,
    releaseDate: args.date,
  })

  if (command === 'preview') {
    console.log(entry.markdown)
    return
  }

  if (command === 'write') {
    await writeChangelogFile({
      changelogPath,
      entryMarkdown: entry.markdown,
    })
    console.log(
      `Updated ${path.relative(repoRoot, changelogPath)} from ${entry.previousTag ?? 'repo start'} to ${entry.targetTag}.`,
    )
    return
  }

  await writeReleaseNotesFile({
    outputPath,
    entryMarkdown: entry.markdown,
  })
  console.log(path.relative(repoRoot, outputPath))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
