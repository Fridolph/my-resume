import { existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

export function resolveWorkspaceRoot() {
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

export function ensureDirectory(path: string) {
  mkdirSync(dirname(path), { recursive: true })
}
