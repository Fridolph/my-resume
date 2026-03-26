import { describe, expect, it } from 'vitest';

import { resolveRepoRoot } from './repo-root';

describe('resolveRepoRoot', () => {
  it('should resolve repo root from source directory', () => {
    const repoRoot = resolveRepoRoot(
      '/Users/fri/Desktop/personal/my-resume/apps/server/src/config',
    );

    expect(repoRoot).toBe('/Users/fri/Desktop/personal/my-resume');
  });

  it('should resolve repo root from compiled dist directory', () => {
    const repoRoot = resolveRepoRoot(
      '/Users/fri/Desktop/personal/my-resume/apps/server/dist/src/config',
    );

    expect(repoRoot).toBe('/Users/fri/Desktop/personal/my-resume');
  });
});
