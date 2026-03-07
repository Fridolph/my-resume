import { Injectable, NotFoundException } from '@nestjs/common'
import { listTranslations, updateTranslation } from '@repo/database'
import type { TranslationRecord } from '@repo/types'

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

    return await updateTranslation(translationId, {
      ...current,
      ...record
    })
  }
}
