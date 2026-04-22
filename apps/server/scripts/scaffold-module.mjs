#!/usr/bin/env node

import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const serverRoot = resolve(__dirname, '..')
const sourceRoot = join(serverRoot, 'src')

function printUsage() {
  console.log(`
Usage:
  pnpm --filter @my-resume/server scaffold:module -- <module-name>

Examples:
  pnpm --filter @my-resume/server scaffold:module -- user
  pnpm --filter @my-resume/server scaffold:module -- interview
`.trim())
}

function runNestGenerate(args) {
  const nestBinary = join(serverRoot, 'node_modules', '.bin', 'nest')
  const result = spawnSync(nestBinary, ['g', ...args], {
    cwd: serverRoot,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

function ensureDirectory(path) {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true })
  }
}

function ensureModuleReadme(moduleName) {
  const moduleRoot = join(sourceRoot, 'modules', moduleName)
  const readmePath = join(moduleRoot, 'README.md')

  if (existsSync(readmePath)) {
    return
  }

  const content = `# ${moduleName} module

## 目录职责

- \`domain/\`：领域对象与纯业务规则
- \`application/\`：用例编排与应用层类型
- \`infrastructure/\`：仓储、外部依赖适配
- \`transport/\`：controller/dto/response 适配
- \`__tests__/\`：模块相关测试
`

  writeFileSync(readmePath, content, 'utf8')
}

const [moduleName] = process.argv.slice(2)

if (!moduleName || moduleName === '--help' || moduleName === '-h') {
  printUsage()
  process.exit(moduleName ? 0 : 1)
}

if (!/^[a-z0-9-]+(?:\/[a-z0-9-]+)*$/.test(moduleName)) {
  console.error(
    'Invalid module name. Use lowercase letters, numbers, "-" and optional "/" for nesting.',
  )
  process.exit(1)
}

const modulePath = `modules/${moduleName}`

runNestGenerate(['module', modulePath])
runNestGenerate(['controller', modulePath])
runNestGenerate(['service', modulePath])

const moduleRoot = join(sourceRoot, modulePath)
ensureDirectory(join(moduleRoot, '__tests__'))
ensureDirectory(join(moduleRoot, 'domain'))
ensureDirectory(join(moduleRoot, 'application'))
ensureDirectory(join(moduleRoot, 'infrastructure'))
ensureDirectory(join(moduleRoot, 'transport'))
ensureDirectory(join(moduleRoot, 'transport', 'dto'))
ensureModuleReadme(moduleName)

console.log(`\nDone. Module scaffold created at: src/${modulePath}`)
