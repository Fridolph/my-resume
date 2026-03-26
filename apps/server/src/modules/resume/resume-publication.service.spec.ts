import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

import { afterEach, describe, expect, it } from 'vitest';

import {
  createDatabase,
  createDatabaseClient,
} from '../../database/database.client';
import type { DatabaseClient } from '../../database/database.client';
import { ResumePublicationRepository } from './resume-publication.repository';
import { createExampleStandardResume } from './domain/standard-resume';
import { ResumePublicationService } from './resume-publication.service';

interface ServiceHarness {
  client: DatabaseClient;
  databaseFilePath: string;
  service: ResumePublicationService;
}

const tempDirectories: string[] = [];

async function prepareTables(client: DatabaseClient) {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS resume_drafts (
      resume_key text PRIMARY KEY NOT NULL,
      schema_version integer NOT NULL,
      resume_json text NOT NULL,
      updated_at integer NOT NULL
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS resume_publication_snapshots (
      id text PRIMARY KEY NOT NULL,
      resume_key text NOT NULL,
      schema_version integer NOT NULL,
      resume_json text NOT NULL,
      published_at integer NOT NULL
    );
  `);

  await client.execute(`
    CREATE INDEX IF NOT EXISTS resume_publication_snapshots_resume_key_published_at_idx
    ON resume_publication_snapshots (resume_key, published_at);
  `);
}

async function createServiceHarness(
  databaseFilePath?: string,
): Promise<ServiceHarness> {
  const nextDatabaseFilePath =
    databaseFilePath ??
    join(
      mkdtempSync(join(tmpdir(), 'my-resume-publication-')),
      'resume.db',
    );

  if (!databaseFilePath) {
    tempDirectories.push(nextDatabaseFilePath.replace(/\/resume\.db$/, ''));
  }

  const client = createDatabaseClient({
    url: `file:${nextDatabaseFilePath}`,
    dialect: 'libsql',
    isRemote: false,
  });
  await prepareTables(client);

  const database = createDatabase(client);
  const repository = new ResumePublicationRepository(database);
  const service = new ResumePublicationService(repository);

  return {
    client,
    databaseFilePath: nextDatabaseFilePath,
    service,
  };
}

describe('ResumePublicationService', () => {
  afterEach(async () => {
    for (const directory of tempDirectories) {
      rmSync(directory, {
        force: true,
        recursive: true,
      });
    }

    tempDirectories.length = 0;
  });

  it('should keep draft editable before publishing', async () => {
    const { client, service } = await createServiceHarness();
    const nextDraft = createExampleStandardResume();

    nextDraft.profile.headline = {
      zh: '资深全栈工程师',
      en: 'Senior Full-Stack Engineer',
    };

    await service.updateDraft(nextDraft);

    expect((await service.getDraft()).resume.profile.headline).toEqual({
      zh: '资深全栈工程师',
      en: 'Senior Full-Stack Engineer',
    });
    expect(await service.getPublished()).toBeNull();

    client.close();
  });

  it('should publish the current draft snapshot', async () => {
    const { client, service } = await createServiceHarness();
    const draft = createExampleStandardResume();

    draft.profile.headline = {
      zh: '可发布版本',
      en: 'Ready to Publish',
    };

    await service.updateDraft(draft);

    const published = await service.publish();

    expect(published.status).toBe('published');
    expect(published.resume.profile.headline).toEqual({
      zh: '可发布版本',
      en: 'Ready to Publish',
    });
    expect(published.publishedAt).toEqual(expect.any(String));

    client.close();
  });

  it('should keep published content stable after draft changes until republish', async () => {
    const { client, service } = await createServiceHarness();
    const firstDraft = createExampleStandardResume();

    firstDraft.profile.headline = {
      zh: '第一版',
      en: 'First Version',
    };

    await service.updateDraft(firstDraft);
    await service.publish();

    const secondDraft = createExampleStandardResume();
    secondDraft.profile.headline = {
      zh: '第二版草稿',
      en: 'Second Draft',
    };

    await service.updateDraft(secondDraft);

    expect((await service.getDraft()).resume.profile.headline).toEqual({
      zh: '第二版草稿',
      en: 'Second Draft',
    });
    expect((await service.getPublished())?.resume.profile.headline).toEqual({
      zh: '第一版',
      en: 'First Version',
    });

    client.close();
  });

  it('should keep draft and published data after recreating the service on the same database', async () => {
    const firstHarness = await createServiceHarness();
    const draft = createExampleStandardResume();

    draft.profile.headline = {
      zh: '持久化版本',
      en: 'Persistent Version',
    };

    await firstHarness.service.updateDraft(draft);
    await firstHarness.service.publish();
    firstHarness.client.close();

    const secondHarness = await createServiceHarness(firstHarness.databaseFilePath);

    expect((await secondHarness.service.getDraft()).resume.profile.headline).toEqual({
      zh: '持久化版本',
      en: 'Persistent Version',
    });
    expect((await secondHarness.service.getPublished())?.resume.profile.headline).toEqual({
      zh: '持久化版本',
      en: 'Persistent Version',
    });

    secondHarness.client.close();
  });
});
