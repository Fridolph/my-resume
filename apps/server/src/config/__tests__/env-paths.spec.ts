import { join, resolve } from 'path'
import { describe, expect, it } from 'vitest'

import { buildServerEnvFilePaths } from '../env-paths'
import { resolveRepoRoot } from '../repo-root'

describe('buildServerEnvFilePaths', () => {
  it('should prefer development local env files first', () => {
    const envFilePaths = buildServerEnvFilePaths('development')

    expect(envFilePaths[0]).toContain('.env.development.local')
    expect(envFilePaths[1]).toContain('.env.local')
    expect(envFilePaths[2]).toContain('.env.development')
    expect(envFilePaths[3]).toContain('.env')
  })

  it('should resolve the actual repository root instead of apps directory', () => {
    expect(
      resolveRepoRoot(
        join(resolve(process.cwd(), '../..'), 'apps/server/dist/src/config'),
      ),
    ).toBe(resolve(process.cwd(), '../..'))
  })
})
