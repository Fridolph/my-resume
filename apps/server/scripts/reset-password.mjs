#!/usr/bin/env node
/**
 * 重置用户密码脚本
 *
 * 用法：
 *   pnpm reset:password -- --username admin --password admin6789
 *   pnpm reset:password -- admin admin6789            # 位置参数写法
 *   pnpm reset:password -- --username test --password test1234 --create --role viewer
 *
 * - 默认连接本地 .data/my-resume.db，可用 DATABASE_URL 覆盖
 * - 密码用后端同一套算法（scrypt，salt 16B，key 64B，base64url）生成哈希后写入
 * - 目标用户不存在时：不带 --create 直接报错；带 --create 则新建
 */
import { scryptSync, randomBytes } from 'node:crypto'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { createClient } from '@libsql/client'

const __dirname = dirname(fileURLToPath(import.meta.url))
// scripts -> server -> apps -> repoRoot
const repoRoot = join(__dirname, '..', '..', '..')

const HASH_ALGORITHM = 'scrypt'
const HASH_VERSION = 'v1'
const SALT_SIZE = 16
const DERIVED_KEY_SIZE = 64

function printUsage() {
  console.log(`
重置用户密码

用法：
  node scripts/reset-password.mjs --username <用户名> --password <新密码> [--create] [--role <角色>]
  node scripts/reset-password.mjs <用户名> <新密码> [--create] [--role <角色>]

选项：
  -u, --username  目标用户名（必填）
  -p, --password  新密码（必填）
      --create    用户不存在时创建（默认 false）
      --role      创建时的角色，默认 viewer
  -h, --help      显示帮助
`)
}

function parseArgs(argv) {
  const options = { create: false, role: 'viewer' }
  const positionals = []

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]

    if (arg === '-h' || arg === '--help') {
      options.help = true
    } else if (arg === '--create') {
      options.create = true
    } else if (arg === '-u' || arg === '--username') {
      options.username = argv[++i]
    } else if (arg === '-p' || arg === '--password') {
      options.password = argv[++i]
    } else if (arg === '--role') {
      options.role = argv[++i]
    } else if (arg.startsWith('--username=')) {
      options.username = arg.slice('--username='.length)
    } else if (arg.startsWith('--password=')) {
      options.password = arg.slice('--password='.length)
    } else if (arg.startsWith('--role=')) {
      options.role = arg.slice('--role='.length)
    } else {
      positionals.push(arg)
    }
  }

  if (!options.username && positionals.length >= 1) {
    options.username = positionals[0]
  }
  if (!options.password && positionals.length >= 2) {
    options.password = positionals[1]
  }

  return options
}

/** 与 PasswordHashService.hashPassword 保持一致 */
function hashPassword(password) {
  const salt = randomBytes(SALT_SIZE)
  const derivedKey = scryptSync(password, salt, DERIVED_KEY_SIZE)

  return [
    HASH_ALGORITHM,
    HASH_VERSION,
    salt.toString('base64url'),
    derivedKey.toString('base64url'),
  ].join('$')
}

function resolveDatabaseUrl() {
  const fromEnv =
    process.env.DATABASE_URL?.trim() ||
    process.env.TURSO_DATABASE_URL?.trim() ||
    process.env.LIBSQL_URL?.trim()

  if (fromEnv) {
    return fromEnv
  }

  return `file:${join(repoRoot, '.data', 'my-resume.db')}`
}

async function main() {
  const options = parseArgs(process.argv.slice(2))

  if (options.help) {
    printUsage()
    return
  }

  if (!options.username || !options.password) {
    console.error('✗ 缺少参数：--username 和 --password 必填\n')
    printUsage()
    process.exitCode = 1
    return
  }

  const url = resolveDatabaseUrl()
  const filePath = url.startsWith('file:') ? url.slice('file:'.length) : null

  if (filePath && filePath !== ':memory:' && !existsSync(filePath)) {
    console.error(`✗ 数据库文件不存在：${filePath}`)
    process.exitCode = 1
    return
  }

  const client = createClient({
    url,
    authToken: process.env.DATABASE_AUTH_TOKEN?.trim() || undefined,
  })

  try {
    const now = Date.now()
    const passwordHash = hashPassword(options.password)

    const result = await client.execute({
      sql: 'UPDATE users SET password_hash = ?, updated_at = ? WHERE username = ?',
      args: [passwordHash, now, options.username],
    })

    if (result.rowsAffected === 0) {
      if (!options.create) {
        console.error(
          `✗ 未找到用户「${options.username}」。如需新建，请加 --create（默认角色 viewer）`,
        )
        process.exitCode = 1
        return
      }

      const id = `${options.username}-${Date.now().toString(36)}`
      await client.execute({
        sql: 'INSERT INTO users (id, username, password_hash, role, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, 1, ?, ?)',
        args: [id, options.username, passwordHash, options.role, now, now],
      })
      console.log(`✓ 已创建用户「${options.username}」并设置密码（角色 ${options.role}）`)
    } else {
      console.log(`✓ 已重置用户「${options.username}」的密码`)
    }

    console.log(`  数据库：${url}`)
  } finally {
    client.close()
  }
}

main().catch(error => {
  console.error('✗ 重置失败：', error)
  process.exitCode = 1
})
