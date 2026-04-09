import { access } from 'node:fs/promises'
import { constants } from 'node:fs'

const requiredPaths = [
  'pnpm-workspace.yaml',
  'turbo.json',
  'apps',
  'apps/README.md',
  'apps/web',
  'apps/web/README.md',
  'apps/admin',
  'apps/admin/README.md',
  'apps/server',
  'apps/server/README.md',
  'apps/server/package.json',
  'apps/server/nest-cli.json',
  'apps/server/tsconfig.json',
  'apps/server/src/main.ts',
  'apps/server/test/app.e2e-spec.ts',
  'packages',
  'packages/README.md',
  'packages/ui',
  'packages/ui/README.md',
  'packages/api-client',
  'packages/api-client/README.md',
  'packages/config',
  'packages/config/README.md',
  'packages/config/tsconfig.base.json',
  'packages/config/eslint.base.cjs',
  'packages/config/env',
  'packages/config/env/README.md',
  'docs/10-架构设计/04-空应用脚手架策略说明.md',
  'src/App.vue',
  'vite.config.ts',
]

async function ensureExists(path) {
  try {
    await access(path, constants.F_OK)
  } catch {
    throw new Error(`Missing required path: ${path}`)
  }
}

async function main() {
  await Promise.all(requiredPaths.map(ensureExists))
  console.log('workspace skeleton check passed')
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
