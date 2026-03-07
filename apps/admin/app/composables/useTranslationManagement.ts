import type { PublishStatus, TranslationNamespace, TranslationRecord, WebLocale } from '@repo/types'

export function useTranslationManagement(initialTranslations?: TranslationRecord[] | null) {
  const translations = useState<TranslationRecord[]>('admin-translations', () => structuredClone(initialTranslations ?? []))
  const keyword = ref('')
  const selectedNamespace = ref<'all' | TranslationNamespace>('all')
  const selectedLocale = ref<'all' | WebLocale>('all')
  const selectedStatus = ref<'all' | PublishStatus>('all')
  const editingId = ref<string | null>(null)
  const isEditorOpen = ref(false)

  const form = reactive({
    value: '',
    status: 'draft' as PublishStatus
  })

  const filteredTranslations = computed(() => {
    return translations.value.filter((record) => {
      const matchesKeyword = !keyword.value
        || record.key.toLowerCase().includes(keyword.value.toLowerCase())
        || record.value.toLowerCase().includes(keyword.value.toLowerCase())
      const matchesNamespace = selectedNamespace.value === 'all' || record.namespace === selectedNamespace.value
      const matchesLocale = selectedLocale.value === 'all' || record.locale === selectedLocale.value
      const matchesStatus = selectedStatus.value === 'all' || record.status === selectedStatus.value
      return matchesKeyword && matchesNamespace && matchesLocale && matchesStatus
    })
  })

  const stats = computed(() => ({
    total: translations.value.length,
    missing: translations.value.filter(item => item.missing).length,
    draft: translations.value.filter(item => item.status === 'draft').length,
    published: translations.value.filter(item => item.status === 'published').length
  }))

  const localeCoverage = computed(() => {
    const localeMap = new Map<string, { total: number, missing: number }>()
    for (const record of translations.value) {
      const current = localeMap.get(record.locale) ?? { total: 0, missing: 0 }
      current.total += 1
      if (record.missing) current.missing += 1
      localeMap.set(record.locale, current)
    }
    return Array.from(localeMap.entries()).map(([locale, data]) => ({
      locale,
      total: data.total,
      missing: data.missing
    }))
  })

  function replaceTranslations(nextTranslations: TranslationRecord[]) {
    translations.value = structuredClone(nextTranslations)
  }

  function openEditor(record: TranslationRecord) {
    editingId.value = record.id
    form.value = record.value
    form.status = record.status
    isEditorOpen.value = true
  }

  function closeEditor() {
    editingId.value = null
    form.value = ''
    form.status = 'draft'
    isEditorOpen.value = false
  }

  function buildTranslationInput() {
    if (!editingId.value) {
      throw createError({
        statusCode: 400,
        statusMessage: '当前未选择可编辑的文案记录'
      })
    }

    const current = translations.value.find(record => record.id === editingId.value)

    if (!current) {
      throw createError({
        statusCode: 404,
        statusMessage: '当前文案记录不存在'
      })
    }

    return {
      namespace: current.namespace,
      key: current.key,
      locale: current.locale as WebLocale,
      value: form.value.trim(),
      status: form.status
    }
  }

  function upsertTranslation(nextTranslation: TranslationRecord) {
    const exists = translations.value.some(record => record.id === nextTranslation.id)
    translations.value = exists
      ? translations.value.map(record => record.id === nextTranslation.id ? nextTranslation : record)
      : [nextTranslation, ...translations.value]
  }

  return {
    translations,
    filteredTranslations,
    keyword,
    selectedNamespace,
    selectedLocale,
    selectedStatus,
    stats,
    localeCoverage,
    isEditorOpen,
    editingId,
    form,
    replaceTranslations,
    openEditor,
    closeEditor,
    buildTranslationInput,
    upsertTranslation
  }
}
