import { BadRequestException, Injectable } from '@nestjs/common'
import { getResumeDocument, updateResumeDocument } from '@repo/database'
import { canTransitionPublishStatus, publishStatusLabels, type ResumeDocument } from '@repo/types'

@Injectable()
export class ResumeService {
  async getResumeDocument() {
    return await getResumeDocument()
  }

  async updateResumeDocument(record: ResumeDocument) {
    const currentDocument = await getResumeDocument()

    if (!canTransitionPublishStatus(currentDocument.status, record.status)) {
      throw new BadRequestException({
        code: 'INVALID_PUBLISH_STATUS_TRANSITION',
        message: `简历状态不允许从 ${publishStatusLabels[currentDocument.status]} 直接流转到 ${publishStatusLabels[record.status]}。`
      })
    }

    return await updateResumeDocument(record)
  }
}
