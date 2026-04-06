export const SQLITE_LOCKED_ERROR_MESSAGE =
  '当前本地 SQLite 数据库正被其他进程占用，请关闭 DB Browser 等工具后重试。';

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function collectErrorCandidates(error: unknown): string[] {
  const queue: unknown[] = [error];
  const visited = new Set<unknown>();
  const candidates: string[] = [];

  while (queue.length > 0) {
    const current = queue.shift();

    if (!current || visited.has(current)) {
      continue;
    }

    visited.add(current);

    if (current instanceof Error) {
      candidates.push(current.message);
      queue.push((current as Error & { cause?: unknown }).cause);
      continue;
    }

    if (!isObjectRecord(current)) {
      continue;
    }

    const code = current.code;
    const message = current.message;
    const rawCode = current.rawCode;

    if (typeof code === 'string') {
      candidates.push(code);
    }

    if (typeof message === 'string') {
      candidates.push(message);
    }

    if (typeof rawCode === 'string') {
      candidates.push(rawCode);
    }

    if ('cause' in current) {
      queue.push(current.cause);
    }
  }

  return candidates;
}

export function isSqliteLockedError(error: unknown): boolean {
  const normalized = collectErrorCandidates(error)
    .join(' ')
    .toLowerCase();

  return (
    normalized.includes('sqlite_busy') ||
    normalized.includes('database is locked') ||
    normalized.includes('database is busy')
  );
}
