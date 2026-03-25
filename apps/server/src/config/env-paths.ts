import { join, resolve } from 'path';

function resolveRepoRoot(): string {
  return resolve(__dirname, '../../../../');
}

export function buildServerEnvFilePaths(nodeEnv: string | undefined): string[] {
  const envName = nodeEnv?.trim() || 'development';
  const repoRoot = resolveRepoRoot();

  return [
    join(repoRoot, `.env.${envName}.local`),
    join(repoRoot, '.env.local'),
    join(repoRoot, `.env.${envName}`),
    join(repoRoot, '.env'),
  ];
}
