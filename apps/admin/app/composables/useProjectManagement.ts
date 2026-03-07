import type {
  ProjectLocaleContent,
  ProjectRecord,
  PublishStatus,
  WebLocale
} from '@repo/types'

function createLocaleContent(locale: WebLocale, overrides?: Partial<ProjectLocaleContent>): ProjectLocaleContent {
  return {
    locale,
    title: overrides?.title ?? '',
    description: overrides?.description ?? '',
    summary: overrides?.summary ?? ''
  }
}

function createProjectRecord(input?: Partial<ProjectRecord>): ProjectRecord {
  return {
    id: input?.id ?? `project_${crypto.randomUUID()}`,
    slug: input?.slug ?? '',
    status: input?.status ?? 'draft',
    sortOrder: input?.sortOrder ?? 0,
    cover: input?.cover ?? '',
    externalUrl: input?.externalUrl ?? '',
    tags: input?.tags ?? [],
    updatedAt: input?.updatedAt ?? new Date().toISOString(),
    locales: input?.locales ?? {
      'zh-CN': createLocaleContent('zh-CN'),
      'en-US': createLocaleContent('en-US')
    }
  }
}

const initialProjects: ProjectRecord[] = [
  createProjectRecord({
    id: 'project_resume_platform',
    slug: 'resume-platform',
    status: 'published',
    sortOrder: 1,
    cover: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
    externalUrl: 'https://github.com/Fridolph/my-resume',
    tags: ['Nuxt 4', 'Monorepo', 'Nuxt UI'],
    locales: {
      'zh-CN': createLocaleContent('zh-CN', {
        title: 'Resume Platform',
        description: 'Monorepo 个人内容平台，包含展示站与管理后台。',
        summary: '用于承载公开展示、后台管理和多语言内容工作流。'
      }),
      'en-US': createLocaleContent('en-US', {
        title: 'Resume Platform',
        description: 'A monorepo content platform with a public site and admin console.',
        summary: 'Used to host the public web experience, admin workflows, and localized content.'
      })
    }
  }),
  createProjectRecord({
    id: 'project_design_system',
    slug: 'design-system-draft',
    status: 'reviewing',
    sortOrder: 2,
    cover: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
    externalUrl: 'https://example.com/design-system',
    tags: ['Design Tokens', 'Reusable UI', 'Theme'],
    locales: {
      'zh-CN': createLocaleContent('zh-CN', {
        title: 'Design System Draft',
        description: '预留 UI 设计系统沉淀方向。',
        summary: '用于验证设计系统说明、组件文档和视觉 token 的组织方式。'
      }),
      'en-US': createLocaleContent('en-US', {
        title: 'Design System Draft',
        description: 'A reserved direction for a design system and reusable UI documentation.',
        summary: 'Validates how tokens, reusable UI, and design-system notes can be managed.'
      })
    }
  }),
  createProjectRecord({
    id: 'project_i18n_hub',
    slug: 'i18n-content-hub',
    status: 'draft',
    sortOrder: 3,
    cover: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    externalUrl: 'https://example.com/i18n-hub',
    tags: ['i18n', 'CMS', 'Content Workflow'],
    locales: {
      'zh-CN': createLocaleContent('zh-CN', {
        title: 'i18n Content Hub',
        description: '预留文案与内容管理中心方向。',
        summary: '用于验证翻译结果、内容版本和项目详情的统一管理方式。'
      }),
      'en-US': createLocaleContent('en-US', {
        title: 'i18n Content Hub',
        description: 'A reserved direction for translation workflow and content management.',
        summary: 'Validates how translations, content versions, and project details can be managed together.'
      })
    }
  })
]

export function useProjectManagement() {
  const projects = useState<ProjectRecord[]>('admin-projects', () => structuredClone(initialProjects))
  const keyword = ref('')
  const selectedLocale = ref<WebLocale>('zh-CN')
  const selectedStatus = ref<'all' | PublishStatus>('all')
  const selectedProjectId = ref<string | null>(projects.value[0]?.id ?? null)
  const isEditorOpen = ref(false)

  const localeOptions = [
    { label: '简体中文', value: 'zh-CN' },
    { label: 'English', value: 'en-US' }
  ] as const

  const statusOptions = [
    { label: '全部状态', value: 'all' },
    { label: 'draft', value: 'draft' },
    { label: 'reviewing', value: 'reviewing' },
    { label: 'published', value: 'published' },
    { label: 'archived', value: 'archived' }
  ] as const

  const filteredProjects = computed(() => {
    return [...projects.value]
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .filter((project) => {
        const localeContent = project.locales[selectedLocale.value]
        const matchesKeyword = !keyword.value
          || project.slug.toLowerCase().includes(keyword.value.toLowerCase())
          || localeContent.title.toLowerCase().includes(keyword.value.toLowerCase())
          || localeContent.description.toLowerCase().includes(keyword.value.toLowerCase())
          || project.tags.some(tag => tag.toLowerCase().includes(keyword.value.toLowerCase()))
        const matchesStatus = selectedStatus.value === 'all' || project.status === selectedStatus.value
        return matchesKeyword && matchesStatus
      })
  })

  const stats = computed(() => ({
    total: projects.value.length,
    published: projects.value.filter(item => item.status === 'published').length,
    reviewing: projects.value.filter(item => item.status === 'reviewing').length,
    draft: projects.value.filter(item => item.status === 'draft').length
  }))

  const selectedProject = computed(() => {
    return projects.value.find(project => project.id === selectedProjectId.value) ?? null
  })

  const editorProject = computed(() => selectedProject.value)
  const editorLocaleContent = computed(() => editorProject.value?.locales[selectedLocale.value] ?? null)

  const localeCoverage = computed(() => {
    return projects.value.map((project) => {
      const localeMap = Object.values(project.locales).map((content) => {
        const missingFields = [content.title, content.description, content.summary].filter(value => value.trim().length === 0).length
        return {
          locale: content.locale,
          missingFields
        }
      })
      return {
        id: project.id,
        slug: project.slug,
        localeMap
      }
    })
  })

  function touchProject(project: ProjectRecord) {
    project.updatedAt = new Date().toISOString()
  }

  function selectProject(id: string) {
    selectedProjectId.value = id
    isEditorOpen.value = true
  }

  function openCreateProject() {
    const nextSortOrder = projects.value.length === 0
      ? 1
      : Math.max(...projects.value.map(project => project.sortOrder)) + 1

    const newProject = createProjectRecord({
      slug: `new-project-${nextSortOrder}`,
      sortOrder: nextSortOrder,
      locales: {
        'zh-CN': createLocaleContent('zh-CN', {
          title: '新项目',
          description: '请补充项目描述。',
          summary: '请补充项目摘要。'
        }),
        'en-US': createLocaleContent('en-US', {
          title: 'New Project',
          description: 'Please fill in the project description.',
          summary: 'Please fill in the project summary.'
        })
      }
    })

    projects.value = [newProject, ...projects.value]
    selectedProjectId.value = newProject.id
    isEditorOpen.value = true
  }

  function closeEditor() {
    isEditorOpen.value = false
  }

  function saveProject() {
    if (!editorProject.value || !editorLocaleContent.value) {
      return
    }

    if (!editorProject.value.slug.trim() || !editorLocaleContent.value.title.trim()) {
      throw createError({
        statusCode: 400,
        statusMessage: '请至少填写 slug 和当前语言标题'
      })
    }

    editorProject.value.tags = editorProject.value.tags.map(tag => tag.trim()).filter(Boolean)
    touchProject(editorProject.value)
  }

  function updateTags(value: string) {
    if (!editorProject.value) {
      return
    }

    editorProject.value.tags = value
      .split('\n')
      .map(tag => tag.trim())
      .filter(Boolean)

    touchProject(editorProject.value)
  }

  function setProjectStatus(status: PublishStatus) {
    if (!editorProject.value) {
      return
    }

    editorProject.value.status = status
    touchProject(editorProject.value)
  }

  function moveProject(id: string, direction: 'up' | 'down') {
    const ordered = [...projects.value].sort((left, right) => left.sortOrder - right.sortOrder)
    const index = ordered.findIndex(item => item.id === id)
    const targetIndex = direction === 'up' ? index - 1 : index + 1

    if (index < 0 || targetIndex < 0 || targetIndex >= ordered.length) {
      return
    }

    const current = ordered[index]
    const target = ordered[targetIndex]

    if (!current || !target) {
      return
    }

    const temp = current.sortOrder
    current.sortOrder = target.sortOrder
    target.sortOrder = temp
    touchProject(current)
    touchProject(target)
    projects.value = [...ordered]
  }

  function removeProject(id: string) {
    const nextProjects = projects.value.filter(project => project.id !== id)
    projects.value = nextProjects
    selectedProjectId.value = nextProjects[0]?.id ?? null
    if (!selectedProjectId.value) {
      isEditorOpen.value = false
    }
  }

  return {
    projects,
    keyword,
    selectedLocale,
    selectedStatus,
    selectedProjectId,
    isEditorOpen,
    localeOptions,
    statusOptions,
    filteredProjects,
    stats,
    selectedProject,
    editorProject,
    editorLocaleContent,
    localeCoverage,
    selectProject,
    openCreateProject,
    closeEditor,
    saveProject,
    updateTags,
    setProjectStatus,
    moveProject,
    removeProject
  }
}
