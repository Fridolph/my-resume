import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const packageJsonPath = path.join(dirname, 'package.json')
const packageVersion = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
  version?: string
}

function resolveLatestGitTag(): string | undefined {
  try {
    const tag = execSync('git tag --sort=-v:refname | head -n 1', {
      cwd: path.join(dirname, '../..'),
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim()

    return tag || undefined
  } catch {
    return undefined
  }
}

const appVersion =
  process.env.NEXT_PUBLIC_APP_VERSION ??
  resolveLatestGitTag() ??
  packageVersion.version ??
  '0.0.0'

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  env: {
    NEXT_PUBLIC_APP_VERSION: appVersion,
  },
  output: 'standalone',
  outputFileTracingRoot: path.join(dirname, '../..'),
  experimental: {
    optimizePackageImports: ['@heroui/react'],
  },
}

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

export default withNextIntl(nextConfig)
