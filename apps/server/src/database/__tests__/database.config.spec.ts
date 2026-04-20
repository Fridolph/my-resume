import { describe, expect, it } from 'vitest'

import { buildDefaultDatabaseUrl, resolveDatabaseConfig } from '../database.config'

describe('database.config', () => {
  it('should fall back to a repo local sqlite file when DATABASE_URL is absent', () => {
    const databaseUrl = buildDefaultDatabaseUrl('/workspace/my-resume')

    expect(databaseUrl).toBe('file:/workspace/my-resume/.data/my-resume.db')
  })

  it('should prefer explicit DATABASE_URL and DATABASE_AUTH_TOKEN', () => {
    const config = resolveDatabaseConfig(
      {
        DATABASE_URL: 'libsql://demo.turso.io',
        DATABASE_AUTH_TOKEN: 'demo-token',
      },
      '/workspace/my-resume',
    )

    expect(config).toEqual({
      url: 'libsql://demo.turso.io',
      authToken: 'demo-token',
      isRemote: true,
      dialect: 'libsql',
    })
  })

  it('should support turbso style auth token fallback for compatibility', () => {
    const config = resolveDatabaseConfig(
      {
        TURSO_AUTH_TOKEN: 'turso-token',
      },
      '/workspace/my-resume',
    )

    expect(config.url).toBe('file:/workspace/my-resume/.data/my-resume.db')
    expect(config.authToken).toBe('turso-token')
    expect(config.isRemote).toBe(false)
  })

  it('should normalize relative sqlite file url to repo root path', () => {
    const config = resolveDatabaseConfig(
      {
        DATABASE_URL: 'file:./.data/my-resume.db',
      },
      '/workspace/my-resume',
    )

    expect(config.url).toBe('file:/workspace/my-resume/.data/my-resume.db')
    expect(config.isRemote).toBe(false)
  })
})
