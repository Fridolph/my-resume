import { BadRequestException, Injectable } from '@nestjs/common'
import { getContentVersionById, getResumeDocument, listContentVersions, restoreResumeDocumentVersion, updateResumeDocument } from '@repo/database'
import { canTransitionPublishStatus, publishStatusLabels, type ResumeDocument, type ResumeVersionRecord, type UserSession } from '@repo/types'

@Injectable()
export class ResumeService {
  async getResumeDocument() {
    return await getResumeDocument()
  }

  async listResumeVersions() {
    return await listContentVersions('resume', 'resume_main') as ResumeVersionRecord[]
  }

  async restoreResumeVersion(versionId: string, currentUser: UserSession) {
    const version = await getContentVersionById<'resume'>(versionId)

    if (!version || version.moduleType != 'resume' || version.entityId !== 'resume_main') {
      throw new BadRequestException({
        code: 'RESUME_VERSION_NOT_FOUND',
        message: `简历版本 ${versionId} 不存在。`
      })
    }

    return await restoreResumeDocumentVersion(version.snapshot, currentUser)
  }

  async updateResumeDocument(record: ResumeDocument, currentUser: UserSession) {
    const currentDocument = await getResumeDocument()

    if (!canTransitionPublishStatus(currentDocument.status, record.status)) {
      throw new BadRequestException({
        code: 'INVALID_PUBLISH_STATUS_TRANSITION',
        message: `简历状态不允许从 ${publishStatusLabels[currentDocument.status]} 直接流转到 ${publishStatusLabels[record.status]}。`
      })
    }

    return await updateResumeDocument(record, currentUser)
  }
}
