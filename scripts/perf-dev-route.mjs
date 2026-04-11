import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
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

async function waitForReachable(url, timeoutMs) {
  const startedAt = Date.now()
  let lastError = null

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const attemptStartedAt = Date.now()
      const response = await fetch(url, {
        redirect: 'manual',
      })

      return {
        elapsedMs: Date.now() - attemptStartedAt,
        reachableAfterMs: Date.now() - startedAt,
        ok: response.ok,
        status: response.status,
      }
    } catch (error) {
      lastError = error
      await new Promise((resolve) => {
        setTimeout(resolve, 500)
      })
    }
  }

  throw new Error(
    `Timed out while waiting for ${url} (${timeoutMs}ms). ${
      lastError instanceof Error ? lastError.message : 'Unknown error'
    }`,
  )
}

async function requestOnce(url) {
  const startedAt = Date.now()
  const response = await fetch(url, {
    redirect: 'manual',
  })

  return {
    elapsedMs: Date.now() - startedAt,
    ok: response.ok,
    status: response.status,
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const target = args.target ?? 'unknown'
  const baseUrl = args['base-url']
  const routes = (args.routes ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
  const output = args.output ?? `.tmp/perf/${target}.json`
  const timeoutMs = Number(args.timeout ?? '120000')

  if (!baseUrl || routes.length === 0) {
    throw new Error(
      'Usage: node scripts/perf-dev-route.mjs --target web --base-url http://127.0.0.1:5555 --routes /,/profile [--output .tmp/perf/dev-web.json]',
    )
  }

  const report = {
    target,
    baseUrl,
    collectedAt: new Date().toISOString(),
    routes: [],
  }

  for (const route of routes) {
    const url = new URL(route, baseUrl).toString()
    const firstReachable = await waitForReachable(url, timeoutMs)
    const warmVisit = await requestOnce(url)

    report.routes.push({
      route,
      url,
      firstReachable,
      warmVisit,
    })
  }

  await mkdir(dirname(output), {
    recursive: true,
  })
  await writeFile(output, JSON.stringify(report, null, 2))

  console.log(`\n[M16] ${target} dev performance report`)
  console.table(
    report.routes.map((entry) => ({
      route: entry.route,
      firstReachableAfterMs: entry.firstReachable.reachableAfterMs,
      firstResponseMs: entry.firstReachable.elapsedMs,
      warmResponseMs: entry.warmVisit.elapsedMs,
      status: entry.warmVisit.status,
    })),
  )
  console.log(`Saved report to ${output}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
