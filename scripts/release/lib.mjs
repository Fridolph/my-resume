import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const SECTION_ORDER = [
  'breaking',
  'feat',
  'fix',
  'refactor',
  'perf',
  'docs',
  'build',
  'ci',
  'test',
  'style',
  'chore',
  'revert',
  'merge',
  'other',
]

const SECTION_LABELS = {
  breaking: 'Breaking Changes',
  feat: '新功能',
  fix: '问题修复',
  refactor: '重构',
  perf: '性能优化',
  docs: '文档',
  build: '构建与发布',
  ci: 'CI / 自动化',
  test: '测试',
  style: '样式',
  chore: '工程与维护',
  revert: '回滚',
  merge: '合并记录',
  other: '其他变更',
}

const CONVENTIONAL_RE =
  /^(?<type>[a-z]+)(?:\((?<scope>[^)]+)\))?(?<breaking>!)?: (?<description>.+)$/i
const MERGE_RE = /^(?<type>merge)(?:\((?<scope>[^)]+)\))?: (?<description>.+)$/i

function execGit(repoRoot, args) {
  return execFileSync('git', ['-C', repoRoot, ...args], {
    encoding: 'utf8',
  }).trim()
}

function tryExecGit(repoRoot, args) {
  try {
    return execGit(repoRoot, args)
  } catch {
    return ''
  }
}

export function normalizeTag(input) {
  if (!input) {
    throw new Error('Missing required tag value.')
  }

  return input.startsWith('v') ? input : `v${input}`
}

export function resolveRepoRoot(cwd = process.cwd()) {
  return execGit(cwd, ['rev-parse', '--show-toplevel'])
}

export function resolveRemoteUrl(repoRoot) {
  return execGit(repoRoot, ['remote', 'get-url', 'origin'])
}

export function resolveRepositoryInfo(remoteUrl) {
  if (remoteUrl.startsWith('git@github.com:')) {
    const slug = remoteUrl
      .replace('git@github.com:', '')
      .replace(/\.git$/, '')
      .trim()

    return {
      provider: 'github',
      slug,
      repoUrl: `https://github.com/${slug}`,
    }
  }

  const httpsMatch = remoteUrl.match(
    /^https:\/\/github\.com\/(?<slug>[^/]+\/[^/]+?)(?:\.git)?$/,
  )

  if (httpsMatch?.groups?.slug) {
    return {
      provider: 'github',
      slug: httpsMatch.groups.slug,
      repoUrl: `https://github.com/${httpsMatch.groups.slug}`,
    }
  }

  return {
    provider: 'generic',
    slug: '',
    repoUrl: '',
  }
}

function resolveCurrentPointedTags(repoRoot, ref) {
  return tryExecGit(repoRoot, [
    'tag',
    '--points-at',
    ref,
    '--list',
    'v*',
    '--sort=-v:refname',
  ])
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
}

function tagExists(repoRoot, candidate) {
  return Boolean(
    tryExecGit(repoRoot, ['rev-parse', '--verify', `${candidate}^{tag}`]) ||
      tryExecGit(repoRoot, ['rev-parse', '--verify', candidate]),
  )
}

export function resolvePreviousTag(repoRoot, { toRef = 'HEAD', targetTag } = {}) {
  const normalizedTargetTag = targetTag ? normalizeTag(targetTag) : null
  const tagsOnRef = resolveCurrentPointedTags(repoRoot, toRef)
  const isExactTaggedRelease =
    normalizedTargetTag && tagsOnRef.includes(normalizedTargetTag)

  const describeRef = isExactTaggedRelease ? `${toRef}^` : toRef
  const previousTag = tryExecGit(repoRoot, [
    'describe',
    '--tags',
    '--match',
    'v*',
    '--abbrev=0',
    describeRef,
  ])

  return previousTag || null
}

function parseCommit(subject, hash, repoUrl) {
  const conventionalMatch = subject.match(CONVENTIONAL_RE)
  const mergeMatch = subject.match(MERGE_RE)
  const match = conventionalMatch ?? mergeMatch
  const url = repoUrl ? `${repoUrl}/commit/${hash}` : ''

  if (!match?.groups) {
    return {
      hash,
      shortHash: hash.slice(0, 7),
      url,
      type: 'other',
      scope: '',
      description: subject,
      raw: subject,
      breaking: false,
    }
  }

  const type = match.groups.type.toLowerCase()
  const normalizedType =
    type in SECTION_LABELS ? type : type === 'feature' ? 'feat' : 'other'

  return {
    hash,
    shortHash: hash.slice(0, 7),
    url,
    type: normalizedType,
    scope: match.groups.scope ?? '',
    description: match.groups.description.trim(),
    raw: subject,
    breaking: Boolean(match.groups.breaking),
  }
}

function buildCompareUrl(repoUrl, previousTag, targetTag) {
  if (!repoUrl || !previousTag || !targetTag) {
    return ''
  }

  return `${repoUrl}/compare/${previousTag}...${targetTag}`
}

export function loadCommits(repoRoot, { fromRef, toRef = 'HEAD', repoUrl = '' }) {
  const range = fromRef ? `${fromRef}..${toRef}` : toRef
  const raw = tryExecGit(repoRoot, ['log', '--reverse', '--format=%H%x1f%s', range])

  if (!raw) {
    return []
  }

  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [hash, subject = ''] = line.split('\u001f')
      return parseCommit(subject, hash, repoUrl)
    })
}

function groupCommits(commits) {
  const grouped = Object.fromEntries(SECTION_ORDER.map((key) => [key, []]))

  for (const commit of commits) {
    if (commit.breaking) {
      grouped.breaking.push(commit)
    }

    grouped[commit.type]?.push(commit) ?? grouped.other.push(commit)
  }

  return grouped
}

function formatCommitLine(commit) {
  const scopePrefix = commit.scope ? `**${commit.scope}:** ` : ''
  const commitSuffix = commit.url
    ? ` ([\`${commit.shortHash}\`](${commit.url}))`
    : ` (\`${commit.shortHash}\`)`

  return `- ${scopePrefix}${commit.description}${commitSuffix}`
}

function renderSections(grouped) {
  const sections = []

  for (const sectionKey of SECTION_ORDER) {
    const commits = grouped[sectionKey]

    if (!commits || commits.length === 0) {
      continue
    }

    sections.push(
      `### ${SECTION_LABELS[sectionKey]}\n\n${commits.map(formatCommitLine).join('\n')}`,
    )
  }

  return sections
}

export function generateReleaseEntry(repoRoot, options = {}) {
  const {
    targetTag,
    toRef = 'HEAD',
    previousTag = resolvePreviousTag(repoRoot, { toRef, targetTag }),
    releaseDate = new Date().toISOString().slice(0, 10),
    remoteUrl = resolveRemoteUrl(repoRoot),
  } = options

  const normalizedTargetTag = normalizeTag(targetTag)
  const { repoUrl } = resolveRepositoryInfo(remoteUrl)
  const commits = loadCommits(repoRoot, {
    fromRef: previousTag ?? undefined,
    toRef,
    repoUrl,
  })
  const grouped = groupCommits(commits)
  const compareUrl = buildCompareUrl(repoUrl, previousTag, normalizedTargetTag)
  const heading = compareUrl
    ? `## [${normalizedTargetTag}](${compareUrl}) - ${releaseDate}`
    : `## ${normalizedTargetTag} - ${releaseDate}`
  const sections = renderSections(grouped)
  const body =
    sections.length > 0
      ? sections.join('\n\n')
      : '### 其他变更\n\n- 本次发布没有识别到可归类的用户可见变更。'

  return {
    targetTag: normalizedTargetTag,
    previousTag,
    toRef,
    releaseDate,
    compareUrl,
    commits,
    markdown: `${heading}\n\n${body}`.trim(),
  }
}

export function getDefaultChangelogContent() {
  return `# Changelog

本文件记录正式进入 \`main\` 并打上 \`v*\` tag 的版本发布说明。

- 版本来源以 Git tag 为准，而不是根 \`package.json\` 的 \`version\` 字段
- 当前先从本次接入之后开始维护，历史版本按需再补录
- 默认发布节奏：\`issue -> development -> main -> tag -> release\`
`
}

export async function writeChangelogFile({
  changelogPath,
  entryMarkdown,
}) {
  let current = ''

  try {
    current = await readFile(changelogPath, 'utf8')
  } catch {
    current = getDefaultChangelogContent()
  }

  const trimmedCurrent = current.trimEnd()
  const withoutDuplicate = trimmedCurrent.replace(
    new RegExp(
      `${escapeRegExp(entryMarkdown.split('\n')[0])}[\\s\\S]*?(?=\\n## |$)`,
      'm',
    ),
    '',
  )
  const normalizedBase = withoutDuplicate.trimEnd()
  const next = `${normalizedBase}\n\n${entryMarkdown}\n`

  await mkdir(path.dirname(changelogPath), { recursive: true })
  await writeFile(changelogPath, next, 'utf8')
}

export async function writeReleaseNotesFile({ outputPath, entryMarkdown }) {
  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(outputPath, `${entryMarkdown}\n`, 'utf8')
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function parseCliArgs(argv) {
  const args = {
    _: [],
  }

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]

    if (!token.startsWith('--')) {
      args._.push(token)
      continue
    }

    const [rawKey, inlineValue] = token.slice(2).split('=')
    const nextValue =
      typeof inlineValue !== 'undefined' ? inlineValue : argv[index + 1]
    const shouldConsumeNext =
      typeof inlineValue === 'undefined' &&
      typeof nextValue !== 'undefined' &&
      !nextValue.startsWith('--')

    if (shouldConsumeNext) {
      args[rawKey] = nextValue
      index += 1
      continue
    }

    args[rawKey] = inlineValue ?? true
  }

  return args
}

export function printUsageAndExit(message) {
  if (message) {
    console.error(message)
  }

  console.error(`Usage:
  pnpm changelog:preview -- --tag v2.2.23 [--from v2.2.22] [--to HEAD]
  pnpm changelog:write -- --tag v2.2.23 [--from v2.2.22] [--to HEAD] [--file CHANGELOG.md]
  pnpm release:notes -- --tag v2.2.23 [--from v2.2.22] [--to v2.2.23] [--output .tmp/release-notes/v2.2.23.md]
`)

  process.exit(1)
}

export function resolveReleaseNotesPath(repoRoot, tag) {
  return path.join(repoRoot, '.tmp', 'release-notes', `${normalizeTag(tag)}.md`)
}

export function ensureTagExists(repoRoot, tag) {
  if (!tagExists(repoRoot, normalizeTag(tag))) {
    throw new Error(`Tag not found locally: ${normalizeTag(tag)}`)
  }
}
