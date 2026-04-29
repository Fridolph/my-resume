import { execFileSync } from 'node:child_process'
import path from 'node:path'

import {
  ensureTagExists,
  parseCliArgs,
  printUsageAndExit,
  resolveReleaseNotesPath,
  resolveRepoRoot,
} from './lib.mjs'

function execCommand(command, args, cwd) {
  execFileSync(command, args, {
    cwd,
    stdio: 'inherit',
  })
}

async function main() {
  const args = parseCliArgs(process.argv.slice(2))

  if (!args.tag) {
    printUsageAndExit('Missing required --tag for GitHub release creation.')
  }

  const repoRoot = resolveRepoRoot()
  const tag = args.tag.startsWith('v') ? args.tag : `v${args.tag}`
  const notesPath = path.resolve(
    repoRoot,
    args['notes-file'] || resolveReleaseNotesPath(repoRoot, tag),
  )

  ensureTagExists(repoRoot, tag)

  if (!args['notes-file']) {
    execCommand(
      'node',
      ['scripts/release/changelog.mjs', 'notes', '--tag', tag, '--to', tag, '--output', notesPath],
      repoRoot,
    )
  }

  const ghArgs = ['release', 'create', tag, '--verify-tag', '--notes-file', notesPath]

  if (args.title) {
    ghArgs.push('--title', String(args.title))
  }

  if (args.draft) {
    ghArgs.push('--draft')
  }

  if (args.prerelease) {
    ghArgs.push('--prerelease')
  }

  if (typeof args.latest !== 'undefined') {
    ghArgs.push(`--latest=${args.latest}`)
  }

  if (args.target) {
    ghArgs.push('--target', String(args.target))
  }

  execCommand('gh', ghArgs, repoRoot)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
