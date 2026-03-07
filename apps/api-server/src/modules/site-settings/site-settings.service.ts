import { Injectable } from '@nestjs/common'
import { getSiteSettingsRecord, updateSiteSettingsRecord } from '@repo/database'
import type { SiteSettingsRecord } from '@repo/types'

@Injectable()
export class SiteSettingsService {
  async getSiteSettings() {
    return await getSiteSettingsRecord()
  }

  async updateSiteSettings(record: SiteSettingsRecord) {
    return await updateSiteSettingsRecord(record)
  }
}
