import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises'
import { dirname, join, relative } from 'node:path'
import process from 'node:process'

function parseArgs(argv) {
  const args = {}

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index]

    if (!current.startsWith('--')) {
      continue
    }

    args[current.slice(2)] = argv[index + 1]
    index += 1
  }

  return args
}

function formatKiB(size) {
  return `${(size / 1024).toFixed(2)} KiB`
}

async function walkFiles(rootDirectory) {
  const entries = await readdir(rootDirectory, {
    withFileTypes: true,
  })
  const files = []

  for (const entry of entries) {
    const absolutePath = join(rootDirectory, entry.name)

    if (entry.isDirectory()) {
      files.push(...(await walkFiles(absolutePath)))
      continue
    }

    files.push(absolutePath)
  }

  return files
}

async function readJsonIfExists(pathname) {
  try {
    return JSON.parse(await readFile(pathname, 'utf8'))
  } catch {
    return null
  }
}

async function summarizeNextApp(appName) {
  const nextDirectory = join('apps', appName, '.next')
  const staticDirectory = join(nextDirectory, 'static')
  const report = {
    app: appName,
    nextDirectory,
    exists: false,
    totalStaticBytes: 0,
    staticFileCount: 0,
    largestAssets: [],
    appBuildManifestRoutes: [],
  }

  try {
    const assetFiles = await walkFiles(staticDirectory)
    const filesWithSize = await Promise.all(
      assetFiles.map(async (pathname) => ({
        pathname,
        size: (await stat(pathname)).size,
      })),
    )

    report.exists = true
    report.totalStaticBytes = filesWithSize.reduce((sum, file) => sum + file.size, 0)
    report.staticFileCount = filesWithSize.length
    report.largestAssets = filesWithSize
      .sort((left, right) => right.size - left.size)
      .slice(0, 12)
      .map((file) => ({
        file: relative(nextDirectory, file.pathname),
        size: file.size,
        sizeLabel: formatKiB(file.size),
      }))

    const manifest = await readJsonIfExists(join(nextDirectory, 'app-build-manifest.json'))

    if (manifest?.pages) {
      report.appBuildManifestRoutes = Object.entries(manifest.pages)
        .map(([route, files]) => ({
          route,
          fileCount: Array.isArray(files) ? files.length : 0,
          files: Array.isArray(files) ? files : [],
        }))
        .sort((left, right) => right.fileCount - left.fileCount)
        .slice(0, 20)
    }

    return report
  } catch {
    return report
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const apps = (args.apps ?? 'web,admin')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
  const output = args.output ?? '.tmp/perf/build-report.json'
  const reports = await Promise.all(apps.map(summarizeNextApp))

  await mkdir(dirname(output), {
    recursive: true,
  })
  await writeFile(
    output,
    JSON.stringify(
      {
        collectedAt: new Date().toISOString(),
        reports,
      },
      null,
      2,
    ),
  )

  for (const report of reports) {
    console.log(`\n[M16] ${report.app} build assets`)
    if (!report.exists) {
      console.log(`- Missing ${report.nextDirectory}; run the app build first.`)
      continue
    }

    console.log(
      `- Static assets: ${report.staticFileCount} files / ${formatKiB(report.totalStaticBytes)}`,
    )
    console.table(
      report.largestAssets.map((asset) => ({
        file: asset.file,
        size: asset.sizeLabel,
      })),
    )

    if (report.appBuildManifestRoutes.length > 0) {
      console.table(
        report.appBuildManifestRoutes.map((route) => ({
          route: route.route,
          fileCount: route.fileCount,
        })),
      )
    }
  }

  console.log(`Saved report to ${output}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
