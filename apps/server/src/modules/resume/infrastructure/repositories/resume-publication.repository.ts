import { Inject, Injectable } from '@nestjs/common'
import { desc, eq } from 'drizzle-orm'

import { DATABASE_INSTANCE } from '../../../../database/database.tokens'
import type { DatabaseInstance } from '../../../../database/database.client'
import {
  createResumeDraftRecord,
  createResumePublicationSnapshotRecord,
  STANDARD_RESUME_KEY,
} from '../../../../database/resume-records'
import { resumeDrafts, resumePublicationSnapshots } from '../../../../database/schema'
import type { StandardResume } from '../../domain/standard-resume'

@Injectable()
export class ResumePublicationRepository {
  constructor(
    @Inject(DATABASE_INSTANCE)
    private readonly database: DatabaseInstance,
  ) {}

  /**
   * 读取当前标准简历草稿
   * @returns 草稿记录或 null
   */
  async findDraft() {
    const [record] = await this.database
      .select()
      .from(resumeDrafts)
      .where(eq(resumeDrafts.resumeKey, STANDARD_RESUME_KEY))
      .limit(1)

    return record ?? null
  }

  /**
   * 写入草稿位并在已存在时覆盖
   * @param resume 草稿内容
   * @param updatedAt 更新时间
   * @returns 保存后的草稿记录或 null
   */
  async saveDraft(resume: StandardResume, updatedAt = new Date()) {
    // draft 表只有一个标准键位，通过 upsert 覆盖当前草稿。
    const draftRecord = createResumeDraftRecord(resume, updatedAt)

    await this.database
      .insert(resumeDrafts)
      .values(draftRecord)
      .onConflictDoUpdate({
        target: resumeDrafts.resumeKey,
        set: {
          schemaVersion: draftRecord.schemaVersion,
          resumeJson: draftRecord.resumeJson,
          updatedAt: draftRecord.updatedAt,
        },
      })

    return await this.findDraft()
  }

  /**
   * 读取最近一次发布快照
   * @returns 发布快照记录或 null
   */
  async findLatestPublishedSnapshot() {
    const [record] = await this.database
      .select()
      .from(resumePublicationSnapshots)
      .where(eq(resumePublicationSnapshots.resumeKey, STANDARD_RESUME_KEY))
      .orderBy(desc(resumePublicationSnapshots.publishedAt))
      .limit(1)

    return record ?? null
  }

  /**
   * 追加写入一条新的发布快照
   * @param resume 发布内容
   * @param publishedAt 发布时间
   * @returns 新发布快照记录
   */
  async createPublishedSnapshot(resume: StandardResume, publishedAt = new Date()) {
    // published snapshot 只追加不覆盖，这是草稿态与发布态的核心差异。
    const snapshotRecord = createResumePublicationSnapshotRecord(resume, publishedAt)

    await this.database.insert(resumePublicationSnapshots).values(snapshotRecord)

    return snapshotRecord
  }
}
