import { join, resolve } from 'path';
import { describe, expect, it } from 'vitest';

import { resolveRepoRoot } from '../repo-root';

describe('resolveRepoRoot', () => {
  const repoRoot = resolve(process.cwd(), '../..');

  it('should resolve repo root from source directory', () => {
    const resolvedRepoRoot = resolveRepoRoot(
      join(repoRoot, 'apps/server/src/config'),
    );

    expect(resolvedRepoRoot).toBe(repoRoot);
  });

  it('should resolve repo root from compiled dist directory', () => {
    const resolvedRepoRoot = resolveRepoRoot(
      join(repoRoot, 'apps/server/dist/src/config'),
    );

    expect(resolvedRepoRoot).toBe(repoRoot);
  });
});
