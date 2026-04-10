import { existsSync, readFileSync } from 'node:fs'
import { basename, dirname, resolve } from 'node:path'
import process from 'node:process'
import { execSync } from 'node:child_process'

function run(command) {
  try {
    return execSync(command, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    return ''
  }
}

function collectChangedTsxFiles() {
  const baseRefs = ['origin/development', 'development']
  let mergeBase = ''

  for (const baseRef of baseRefs) {
    mergeBase = run(`git merge-base HEAD ${baseRef}`)

    if (mergeBase) {
      break
    }
  }

  const trackedFiles = mergeBase
    ? run(`git diff --name-only --diff-filter=ACMR ${mergeBase}...HEAD`)
    : run('git diff --name-only --diff-filter=ACMR HEAD')
  const untrackedFiles = run('git ls-files --others --exclude-standard')

  return [...new Set([...trackedFiles.split('\n'), ...untrackedFiles.split('\n')])]
    .map((file) => file.trim())
    .filter(Boolean)
    .filter((file) => file.endsWith('.tsx'))
}

function countLocalTypeDeclarations(source) {
  return (source.match(/^\s*(?:export\s+)?(?:interface|type)\s+\w+/gm) ?? []).length
}

function findModuleTypesCandidate(file) {
  const normalizedFile = file.replace(/\\/g, '/')
  const match = normalizedFile.match(/^(apps\/(?:admin|web)\/modules\/[^/]+)\//)

  if (!match) {
    return []
  }

  const moduleRoot = match[1]
  const name = basename(file, '.tsx')

  return [
    resolve(`${moduleRoot}/types/${name}.types.ts`),
    resolve(`${moduleRoot}/types/${name}.types.tsx`),
  ]
}

function findLegacyAdjacentCandidate(file) {
  return [
    resolve(file.replace(/\.tsx$/, '.types.ts')),
    resolve(file.replace(/\.tsx$/, '.types.tsx')),
    resolve(dirname(file), 'types', `${basename(file, '.tsx')}.types.ts`),
    resolve(dirname(file), 'types', `${basename(file, '.tsx')}.types.tsx`),
  ]
}

function main() {
  const tsxFiles = collectChangedTsxFiles()

  if (tsxFiles.length === 0) {
    console.log('[check-tsx-types] no changed tsx files to validate')
    return
  }

  const violations = []

  for (const file of tsxFiles) {
    const absolutePath = resolve(file)

    if (!existsSync(absolutePath)) {
      continue
    }

    const source = readFileSync(absolutePath, 'utf8')
    const lineCount = source.split('\n').length
    const localTypeCount = countLocalTypeDeclarations(source)

    if (lineCount <= 200 || localTypeCount <= 2) {
      continue
    }

    const candidates =
      file.startsWith('apps/admin/modules/') || file.startsWith('apps/web/modules/')
        ? [...findModuleTypesCandidate(file), ...findLegacyAdjacentCandidate(file)]
      : findLegacyAdjacentCandidate(file)

    const hasAdjacentTypesFile = candidates.some((candidate) => existsSync(candidate))

    if (!hasAdjacentTypesFile) {
      violations.push({
        file,
        lineCount,
        localTypeCount,
      })
    }
  }

  if (violations.length === 0) {
    console.log('[check-tsx-types] passed')
    return
  }

  console.error(
    '[check-tsx-types] the following changed tsx files exceed 200 lines and declare more than 2 local types, but do not provide the required .types.ts file:',
  )

  for (const violation of violations) {
    console.error(
      `- ${violation.file} (${violation.lineCount} lines / ${violation.localTypeCount} local types)`,
    )
  }

  process.exitCode = 1
}

main()
