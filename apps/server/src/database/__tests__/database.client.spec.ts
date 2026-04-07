import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

import { afterEach, describe, expect, it } from 'vitest';

import {
  createDatabaseClient,
  probeDatabaseConnection,
} from '../database.client';
import { DatabaseRuntimeConfig } from '../database.config';

describe('database.client', () => {
  const tempDirectories: string[] = [];

  afterEach(() => {
    for (const directory of tempDirectories) {
      rmSync(directory, {
        force: true,
        recursive: true,
      });
    }

    tempDirectories.length = 0;
  });

  it('should connect to a local libsql sqlite file and answer a probe query', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'my-resume-db-'));
    tempDirectories.push(directory);

    const config: DatabaseRuntimeConfig = {
      url: `file:${join(directory, 'resume.db')}`,
      dialect: 'libsql',
      isRemote: false,
    };

    const client = createDatabaseClient(config);
    const result = await probeDatabaseConnection(client);

    expect(result.rows.length).toBe(1);
  });
});
