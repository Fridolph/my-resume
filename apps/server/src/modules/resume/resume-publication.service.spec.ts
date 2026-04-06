import { ServiceUnavailableException } from '@nestjs/common';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

import { afterEach, describe, expect, it } from 'vitest';

import {
  createDatabase,
  createDatabaseClient,
} from '../../database/database.client';
import type { DatabaseClient } from '../../database/database.client';
import { SQLITE_LOCKED_ERROR_MESSAGE } from '../../database/sqlite-lock';
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

  it('should publish edited module content only after manual publish', async () => {
    const { client, service } = await createServiceHarness();
    const initialDraft = createExampleStandardResume();

    await service.updateDraft(initialDraft);
    await service.publish();

    const nextDraft = createExampleStandardResume();

    nextDraft.education[0]!.schoolName = {
      zh: '升级后的学校信息',
      en: 'Updated Education Entry',
    };
    nextDraft.experiences[0]!.companyName = {
      zh: '新的工作经历公司',
      en: 'Updated Experience Company',
    };
    nextDraft.projects[0]!.name = {
      zh: '新的项目名称',
      en: 'Updated Project Name',
    };
    nextDraft.projects[0]!.links = [
      {
        label: {
          zh: '在线演示',
          en: 'Live Demo',
        },
        url: 'https://demo.example.com/resume-project',
      },
    ];
    nextDraft.skills[0]!.keywords = ['TypeScript', 'Next.js', 'NestJS'];
    nextDraft.highlights[0]!.title = {
      zh: '新的优势总结',
      en: 'Updated Highlight',
    };
    nextDraft.profile.links = [
      {
        label: {
          zh: '作品集',
          en: 'Portfolio',
        },
        url: 'https://portfolio.example.com',
      },
    ];
    nextDraft.profile.interests = [
      {
        zh: '知识库构建',
        en: 'Knowledge Base Design',
      },
    ];

    await service.updateDraft(nextDraft);

    const publishedBeforeRepublish = await service.getPublished();

    expect(publishedBeforeRepublish?.resume.education[0]?.schoolName.zh).not.toBe(
      '升级后的学校信息',
    );
    expect(publishedBeforeRepublish?.resume.projects[0]?.links).not.toEqual([
      {
        label: {
          zh: '在线演示',
          en: 'Live Demo',
        },
        url: 'https://demo.example.com/resume-project',
      },
    ]);
    expect(publishedBeforeRepublish?.resume.profile.links).not.toEqual([
      {
        label: {
          zh: '作品集',
          en: 'Portfolio',
        },
        url: 'https://portfolio.example.com',
      },
    ]);

    const republished = await service.publish();

    expect(republished.resume.education[0]?.schoolName.zh).toBe('升级后的学校信息');
    expect(republished.resume.experiences[0]?.companyName.zh).toBe('新的工作经历公司');
    expect(republished.resume.projects[0]?.name.zh).toBe('新的项目名称');
    expect(republished.resume.projects[0]?.links).toEqual([
      {
        label: {
          zh: '在线演示',
          en: 'Live Demo',
        },
        url: 'https://demo.example.com/resume-project',
      },
    ]);
    expect(republished.resume.skills[0]?.keywords).toEqual([
      'TypeScript',
      'Next.js',
      'NestJS',
    ]);
    expect(republished.resume.highlights[0]?.title.zh).toBe('新的优势总结');
    expect(republished.resume.profile.links).toEqual([
      {
        label: {
          zh: '作品集',
          en: 'Portfolio',
        },
        url: 'https://portfolio.example.com',
      },
    ]);
    expect(republished.resume.profile.interests).toEqual([
      {
        zh: '知识库构建',
        en: 'Knowledge Base Design',
      },
    ]);

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

  it('should normalize legacy draft and published snapshots when hero config is missing', async () => {
    const service = new ResumePublicationService({
      findDraft: async () => {
        const legacyDraft = createExampleStandardResume() as ReturnType<
          typeof createExampleStandardResume
        > & {
          profile: Omit<
            ReturnType<typeof createExampleStandardResume>['profile'],
            'hero'
          > & { hero?: undefined };
        };

        delete legacyDraft.profile.hero;

        return {
          resumeJson: legacyDraft,
          updatedAt: new Date('2026-04-06T00:00:00.000Z'),
        };
      },
      saveDraft: async () => {
        throw new Error('not used');
      },
      createPublishedSnapshot: async () => {
        throw new Error('not used');
      },
      findLatestPublishedSnapshot: async () => {
        const legacyPublished = createExampleStandardResume() as ReturnType<
          typeof createExampleStandardResume
        > & {
          profile: Omit<
            ReturnType<typeof createExampleStandardResume>['profile'],
            'hero'
          > & { hero?: undefined };
        };

        delete legacyPublished.profile.hero;

        return {
          id: 'published-legacy',
          resumeKey: 'standard-resume',
          schemaVersion: 1,
          resumeJson: legacyPublished,
          publishedAt: new Date('2026-04-06T00:00:00.000Z'),
        };
      },
    } as unknown as ResumePublicationRepository);

    const draft = await service.getDraft();
    const published = await service.getPublished();

    expect(draft.resume.profile.hero.frontImageUrl).toBe('/img/avatar.jpg');
    expect(draft.resume.profile.hero.slogans).toHaveLength(2);
    expect(published?.resume.profile.hero.backImageUrl).toBe('/img/avatar2.jpg');
    expect(published?.resume.profile.hero.linkUrl).toBe(
      'https://github.com/Fridolph/my-resume',
    );
  });

  it('should surface a friendly message when draft save hits a SQLite file lock', async () => {
    const service = new ResumePublicationService({
      findDraft: async () => ({
        resumeJson: createExampleStandardResume(),
        updatedAt: new Date('2026-04-05T08:00:00.000Z'),
      }),
      saveDraft: async () => {
        throw new Error('Failed query', {
          cause: new Error('database is locked', {
            cause: {
              code: 'SQLITE_BUSY',
            },
          }),
        });
      },
      createPublishedSnapshot: async () => {
        throw new Error('not used');
      },
      findLatestPublishedSnapshot: async () => null,
    } as unknown as ResumePublicationRepository);

    await expect(
      service.updateDraft(createExampleStandardResume()),
    ).rejects.toEqual(
      expect.objectContaining({
        message: SQLITE_LOCKED_ERROR_MESSAGE,
      }),
    );
  });

  it('should surface a friendly message when publish hits a SQLite file lock', async () => {
    const service = new ResumePublicationService({
      findDraft: async () => ({
        resumeJson: createExampleStandardResume(),
        updatedAt: new Date('2026-04-05T08:00:00.000Z'),
      }),
      saveDraft: async () => ({
        resumeJson: createExampleStandardResume(),
        updatedAt: new Date('2026-04-05T08:00:00.000Z'),
      }),
      createPublishedSnapshot: async () => {
        throw new Error('publish failed', {
          cause: {
            code: 'SQLITE_BUSY',
            message: 'database is locked',
          },
        });
      },
      findLatestPublishedSnapshot: async () => null,
    } as unknown as ResumePublicationRepository);

    await expect(service.publish()).rejects.toEqual(
      expect.objectContaining({
        message: SQLITE_LOCKED_ERROR_MESSAGE,
      }),
    );
  });

  it('should surface a friendly message when draft seeding hits a SQLite file lock', async () => {
    const service = new ResumePublicationService({
      findDraft: async () => null,
      saveDraft: async () => {
        throw new Error('seed failed', {
          cause: {
            code: 'SQLITE_BUSY',
            message: 'database is locked',
          },
        });
      },
      createPublishedSnapshot: async () => {
        throw new Error('not used');
      },
      findLatestPublishedSnapshot: async () => null,
    } as unknown as ResumePublicationRepository);

    await expect(service.getDraft()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    await expect(service.getDraft()).rejects.toEqual(
      expect.objectContaining({
        message: SQLITE_LOCKED_ERROR_MESSAGE,
      }),
    );
  });
});
