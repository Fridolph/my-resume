import { Injectable } from '@nestjs/common'
import { getResumeDocument, updateResumeDocument } from '@repo/database'
import type { ResumeDocument } from '@repo/types'

@Injectable()
export class ResumeService {
  async getResumeDocument() {
    return await getResumeDocument()
  }

  async updateResumeDocument(record: ResumeDocument) {
    return await updateResumeDocument(record)
  }
}
