import { describe, expect, it } from 'vitest';

import { buildServerEnvFilePaths } from './env-paths';

describe('buildServerEnvFilePaths', () => {
  it('should prefer development local env files first', () => {
    const envFilePaths = buildServerEnvFilePaths('development');

    expect(envFilePaths[0]).toContain('.env.development.local');
    expect(envFilePaths[1]).toContain('.env.local');
    expect(envFilePaths[2]).toContain('.env.development');
    expect(envFilePaths[3]).toContain('.env');
  });
});
