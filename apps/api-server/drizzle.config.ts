import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'drizzle-kit'

function resolveWorkspaceRoot() {
  let current = process.cwd()

  while (!existsSync(resolve(current, 'pnpm-workspace.yaml'))) {
    const parent = resolve(current, '..')
    if (parent === current) {
      throw new Error('Unable to locate workspace root from current working directory.')
    }
    current = parent
  }

  return current
}

const workspaceRoot = resolveWorkspaceRoot()

export default defineConfig({
  dialect: 'sqlite',
  schema: resolve(workspaceRoot, 'packages/database/src/schema/*.ts'),
  out: resolve(workspaceRoot, 'packages/database/drizzle'),
  dbCredentials: {
    url: resolve(workspaceRoot, 'data/platform.sqlite')
  }
})
