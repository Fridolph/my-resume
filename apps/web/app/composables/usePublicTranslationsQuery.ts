import type { TranslationRecord } from '@repo/types'

export async function usePublicTranslationsQuery() {
  const apiClient = usePlatformApiClient()
  const state = useState<TranslationRecord[]>('web-public-translations', () => [])

  const asyncData = await useAsyncData('web-public-translations', async () => {
    const records = await apiClient.listTranslations()
    const publishedRecords = records.filter(record => record.status === 'published')
    state.value = publishedRecords
    return publishedRecords
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
