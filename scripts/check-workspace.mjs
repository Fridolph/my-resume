import { access } from 'node:fs/promises'
import { constants } from 'node:fs'

const requiredPaths = [
  'pnpm-workspace.yaml',
  'turbo.json',
  'apps',
  'packages',
  'src/App.vue',
  'vite.config.ts'
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
