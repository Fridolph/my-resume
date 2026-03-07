import { getSiteSettingsRecord } from '@repo/database'

export default defineEventHandler(async () => {
  return await getSiteSettingsRecord()
})
