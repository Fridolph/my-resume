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
    cover: input?.cover ?? 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
    externalUrl: input?.externalUrl ?? 'https://example.com/project',
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
  })
]

export function useProjectManagement(initialProjectsValue?: ProjectRecord[] | null) {
  const projects = useState<ProjectRecord[]>('admin-projects', () => structuredClone(initialProjectsValue ?? initialProjects))
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

  function replaceProjects(nextProjects: ProjectRecord[]) {
    projects.value = structuredClone(nextProjects)
    selectedProjectId.value = nextProjects[0]?.id ?? null
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

  function buildProjectInput() {
    if (!editorProject.value || !editorLocaleContent.value) {
      throw createError({
        statusCode: 400,
        statusMessage: '当前没有可保存的项目'
      })
    }

    if (!editorProject.value.slug.trim() || !editorLocaleContent.value.title.trim()) {
      throw createError({
        statusCode: 400,
        statusMessage: '请至少填写 slug 和当前语言标题'
      })
    }

    editorProject.value.tags = editorProject.value.tags.map(tag => tag.trim()).filter(Boolean)
    touchProject(editorProject.value)

    return {
      id: editorProject.value.id,
      slug: editorProject.value.slug.trim(),
      status: editorProject.value.status,
      sortOrder: editorProject.value.sortOrder,
      cover: editorProject.value.cover.trim(),
      externalUrl: editorProject.value.externalUrl.trim(),
      tags: [...editorProject.value.tags],
      locales: structuredClone(editorProject.value.locales)
    }
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
      return null
    }

    const current = ordered[index]
    const target = ordered[targetIndex]

    if (!current || !target) {
      return null
    }

    const temp = current.sortOrder
    current.sortOrder = target.sortOrder
    target.sortOrder = temp
    touchProject(current)
    touchProject(target)
    projects.value = [...ordered]

    return {
      current: structuredClone(current),
      target: structuredClone(target)
    }
  }

  function removeProjectLocally(id: string) {
    const nextProjects = projects.value.filter(project => project.id !== id)
    projects.value = nextProjects
    selectedProjectId.value = nextProjects[0]?.id ?? null
    if (!selectedProjectId.value) {
      isEditorOpen.value = false
    }
  }

  function upsertProject(nextProject: ProjectRecord) {
    const exists = projects.value.some(project => project.id === nextProject.id)
    projects.value = exists
      ? projects.value.map(project => project.id === nextProject.id ? nextProject : project)
      : [...projects.value, nextProject]
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
    replaceProjects,
    selectProject,
    openCreateProject,
    closeEditor,
    buildProjectInput,
    updateTags,
    setProjectStatus,
    moveProject,
    removeProjectLocally,
    upsertProject
  }
}
