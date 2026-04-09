import { join } from 'path'
import { resolveRepoRoot } from './repo-root'

export function buildServerEnvFilePaths(nodeEnv: string | undefined): string[] {
  const envName = nodeEnv?.trim() || 'development'
  const repoRoot = resolveRepoRoot(__dirname)

  return [
    join(repoRoot, `.env.${envName}.local`),
    join(repoRoot, '.env.local'),
    join(repoRoot, `.env.${envName}`),
    join(repoRoot, '.env'),
  ]
}
