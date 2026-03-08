import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { listTranslations, updateTranslation } from '@repo/database'
import { canTransitionPublishStatus, publishStatusLabels, type TranslationRecord } from '@repo/types'

@Injectable()
export class TranslationsService {
  async listTranslations() {
    return await listTranslations()
  }

  async updateTranslation(
    translationId: string,
    record: Omit<TranslationRecord, 'updatedAt' | 'id' | 'missing'>
  ) {
    const translations = await listTranslations()
    const current = translations.find(item => item.id === translationId)

    if (!current) {
      throw new NotFoundException(`Translation ${translationId} not found`)
    }

    if (!canTransitionPublishStatus(current.status, record.status)) {
      throw new BadRequestException({
        code: 'INVALID_PUBLISH_STATUS_TRANSITION',
        message: `文案状态不允许从 ${publishStatusLabels[current.status]} 直接流转到 ${publishStatusLabels[record.status]}。`
      })
    }

    return await updateTranslation(translationId, {
      ...current,
      ...record
    })
  }
}
