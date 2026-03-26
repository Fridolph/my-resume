import { mkdirSync } from 'fs';
import { dirname, join, resolve } from 'path';

export interface DatabaseRuntimeConfig {
  url: string;
  authToken?: string;
  isRemote: boolean;
  dialect: 'libsql';
}

function resolveRepoRoot(): string {
  return resolve(__dirname, '../../../../');
}

function firstDefinedValue(
  ...values: Array<string | undefined>
): string | undefined {
  for (const value of values) {
    const normalized = value?.trim();

    if (normalized) {
      return normalized;
    }
  }

  return undefined;
}

export function buildDefaultDatabaseUrl(repoRoot = resolveRepoRoot()): string {
  return `file:${join(repoRoot, '.data', 'my-resume.db')}`;
}

export function ensureLocalDatabaseDirectory(url: string): void {
  if (!url.startsWith('file:')) {
    return;
  }

  const filePath = url.slice('file:'.length);

  if (!filePath || filePath.startsWith(':memory:') || filePath.includes('mode=memory')) {
    return;
  }

  mkdirSync(dirname(filePath), {
    recursive: true,
  });
}

export function resolveDatabaseConfig(
  env: NodeJS.ProcessEnv,
  repoRoot = resolveRepoRoot(),
): DatabaseRuntimeConfig {
  const url =
    firstDefinedValue(
      env.DATABASE_URL,
      env.TURSO_DATABASE_URL,
      env.LIBSQL_URL,
    ) || buildDefaultDatabaseUrl(repoRoot);

  const authToken = firstDefinedValue(
    env.DATABASE_AUTH_TOKEN,
    env.TURSO_AUTH_TOKEN,
    env.LIBSQL_AUTH_TOKEN,
  );

  return {
    url,
    authToken,
    isRemote:
      url.startsWith('libsql://') ||
      url.startsWith('https://') ||
      url.startsWith('http://'),
    dialect: 'libsql',
  };
}
