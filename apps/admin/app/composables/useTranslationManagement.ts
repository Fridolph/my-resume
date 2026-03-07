import type { PublishStatus, TranslationNamespace, TranslationRecord } from '@repo/types'

const initialTranslations: TranslationRecord[] = [
  {
    id: 'tr_1',
    namespace: 'common',
    key: 'nav.home',
    locale: 'zh-CN',
    value: '首页',
    status: 'published',
    missing: false,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'tr_2',
    namespace: 'common',
    key: 'nav.home',
    locale: 'en-US',
    value: 'Home',
    status: 'published',
    missing: false,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'tr_3',
    namespace: 'resume',
    key: 'resume.hero.title',
    locale: 'zh-CN',
    value: '在线简历',
    status: 'draft',
    missing: false,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'tr_4',
    namespace: 'resume',
    key: 'resume.hero.title',
    locale: 'en-US',
    value: '',
    status: 'draft',
    missing: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'tr_5',
    namespace: 'project',
    key: 'project.list.title',
    locale: 'zh-CN',
    value: '项目列表',
    status: 'published',
    missing: false,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'tr_6',
    namespace: 'seo',
    key: 'home.description',
    locale: 'en-US',
    value: 'Personal content platform homepage',
    status: 'reviewing',
    missing: false,
    updatedAt: new Date().toISOString()
  }
]

export function useTranslationManagement() {
  const translations = useState<TranslationRecord[]>('admin-translations', () => structuredClone(initialTranslations))
  const keyword = ref('')
  const selectedNamespace = ref<'all' | TranslationNamespace>('all')
  const selectedLocale = ref<'all' | 'zh-CN' | 'en-US'>('all')
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

  function saveTranslation() {
    if (!editingId.value) return

    translations.value = translations.value.map((record) => {
      if (record.id !== editingId.value) {
        return record
      }

      const nextValue = form.value.trim()
      return {
        ...record,
        value: nextValue,
        status: form.status,
        missing: nextValue.length === 0,
        updatedAt: new Date().toISOString()
      }
    })

    closeEditor()
  }

  function toggleStatus(recordId: string) {
    translations.value = translations.value.map((record) => {
      if (record.id !== recordId) {
        return record
      }

      const nextStatus: PublishStatus = record.status === 'published' ? 'draft' : 'published'
      return {
        ...record,
        status: nextStatus,
        updatedAt: new Date().toISOString()
      }
    })
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
    openEditor,
    closeEditor,
    saveTranslation,
    toggleStatus
  }
}
