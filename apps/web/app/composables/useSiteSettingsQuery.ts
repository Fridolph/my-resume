import type { SiteSettingsRecord } from '@repo/types'

export async function useSiteSettingsQuery() {
  const apiClient = usePlatformApiClient()
  const state = useState<SiteSettingsRecord | null>('web-site-settings', () => null)

  const asyncData = await useAsyncData('web-site-settings', async () => {
    const record = await apiClient.getSiteSettings()
    state.value = record
    return record
  }, {
    default: () => state.value,
    server: true
  })

  watch(asyncData.data, (value) => {
    if (value) {
      state.value = value
    }
  }, { immediate: true })

  return {
    ...asyncData,
    state
  }
}
