import type {
  PublishStatus,
  ResumeContactItem,
  ResumeDocument,
  ResumeEducationItem,
  ResumeExperienceItem,
  ResumeLocaleContent,
  ResumeSkillGroup,
  WebLocale
} from '@repo/types'

function createEducationItem(input?: Partial<ResumeEducationItem>): ResumeEducationItem {
  return {
    id: input?.id ?? `edu_${crypto.randomUUID()}`,
    school: input?.school ?? '',
    degree: input?.degree ?? '',
    period: input?.period ?? '',
    summary: input?.summary ?? ''
  }
}

function createExperienceItem(input?: Partial<ResumeExperienceItem>): ResumeExperienceItem {
  return {
    id: input?.id ?? `exp_${crypto.randomUUID()}`,
    company: input?.company ?? '',
    role: input?.role ?? '',
    period: input?.period ?? '',
    summary: input?.summary ?? ''
  }
}

function createSkillGroup(input?: Partial<ResumeSkillGroup>): ResumeSkillGroup {
  return {
    id: input?.id ?? `skill_${crypto.randomUUID()}`,
    title: input?.title ?? '',
    items: input?.items ?? []
  }
}

function createContactItem(input?: Partial<ResumeContactItem>): ResumeContactItem {
  return {
    id: input?.id ?? `contact_${crypto.randomUUID()}`,
    label: input?.label ?? '',
    value: input?.value ?? '',
    href: input?.href ?? ''
  }
}

const initialResumeDocument: ResumeDocument = {
  id: 'resume_main',
  status: 'draft',
  updatedAt: new Date().toISOString(),
  locales: {
    'zh-CN': {
      locale: 'zh-CN',
      baseInfo: {
        fullName: 'Fridolph',
        headline: '高级前端工程师 / Nuxt 全栈方向',
        location: '中国 · 上海',
        summary: '负责个人内容平台的前端架构、后台管理与多语言内容体系建设。'
      },
      education: [
        createEducationItem({
          id: 'edu_zh_1',
          school: '某某大学',
          degree: '计算机科学与技术',
          period: '2016 - 2020',
          summary: '系统学习前端工程、软件工程与数据结构。'
        })
      ],
      experiences: [
        createExperienceItem({
          id: 'exp_zh_1',
          company: '某科技公司',
          role: '前端工程师',
          period: '2020 - 至今',
          summary: '负责 Nuxt / Vue 应用架构、组件体系与工程化建设。'
        })
      ],
      skillGroups: [
        createSkillGroup({
          id: 'skill_zh_1',
          title: '核心技术',
          items: ['Vue 3', 'Nuxt 4', 'TypeScript', 'Node.js']
        }),
        createSkillGroup({
          id: 'skill_zh_2',
          title: '工程能力',
          items: ['Monorepo', '设计系统', '性能优化', 'CI/CD']
        })
      ],
      contacts: [
        createContactItem({
          id: 'contact_zh_1',
          label: '邮箱',
          value: 'hello@fridolph.com',
          href: 'mailto:hello@fridolph.com'
        }),
        createContactItem({
          id: 'contact_zh_2',
          label: 'GitHub',
          value: 'github.com/Fridolph',
          href: 'https://github.com/Fridolph'
        })
      ]
    },
    'en-US': {
      locale: 'en-US',
      baseInfo: {
        fullName: 'Fridolph',
        headline: 'Senior Frontend Engineer / Nuxt Full-stack Track',
        location: 'Shanghai, China',
        summary: 'Building the public content site, admin console, and localized content workflow for the personal platform.'
      },
      education: [
        createEducationItem({
          id: 'edu_en_1',
          school: 'Example University',
          degree: 'B.Sc. in Computer Science',
          period: '2016 - 2020',
          summary: 'Focused on frontend engineering, software engineering, and core computer science concepts.'
        })
      ],
      experiences: [
        createExperienceItem({
          id: 'exp_en_1',
          company: 'Example Tech',
          role: 'Frontend Engineer',
          period: '2020 - Present',
          summary: 'Worked on Nuxt / Vue architecture, reusable components, and engineering workflows.'
        })
      ],
      skillGroups: [
        createSkillGroup({
          id: 'skill_en_1',
          title: 'Core Stack',
          items: ['Vue 3', 'Nuxt 4', 'TypeScript', 'Node.js']
        }),
        createSkillGroup({
          id: 'skill_en_2',
          title: 'Engineering',
          items: ['Monorepo', 'Design System', 'Performance', 'CI/CD']
        })
      ],
      contacts: [
        createContactItem({
          id: 'contact_en_1',
          label: 'Email',
          value: 'hello@fridolph.com',
          href: 'mailto:hello@fridolph.com'
        }),
        createContactItem({
          id: 'contact_en_2',
          label: 'GitHub',
          value: 'github.com/Fridolph',
          href: 'https://github.com/Fridolph'
        })
      ]
    }
  }
}

function createLocaleCoverage(content: ResumeLocaleContent) {
  const missingFields = [
    content.baseInfo.fullName,
    content.baseInfo.headline,
    content.baseInfo.location,
    content.baseInfo.summary,
    ...content.education.flatMap(item => [item.school, item.degree, item.period, item.summary]),
    ...content.experiences.flatMap(item => [item.company, item.role, item.period, item.summary]),
    ...content.skillGroups.flatMap(item => [item.title, ...item.items]),
    ...content.contacts.flatMap(item => [item.label, item.value, item.href ?? ''])
  ].filter(value => value.trim().length === 0).length

  return {
    locale: content.locale,
    educationCount: content.education.length,
    experienceCount: content.experiences.length,
    skillGroupCount: content.skillGroups.length,
    contactCount: content.contacts.length,
    missingFields
  }
}

export function useResumeManagement() {
  const resumeDocument = useState<ResumeDocument>('admin-resume-document', () => structuredClone(initialResumeDocument))
  const selectedLocale = ref<WebLocale>('zh-CN')

  const localeOptions = [
    { label: '简体中文', value: 'zh-CN' },
    { label: 'English', value: 'en-US' }
  ] as const

  const publishStatusOptions = [
    { label: 'draft', value: 'draft' },
    { label: 'reviewing', value: 'reviewing' },
    { label: 'published', value: 'published' },
    { label: 'archived', value: 'archived' }
  ] as const satisfies Array<{ label: string, value: PublishStatus }>

  const currentLocaleContent = computed(() => resumeDocument.value.locales[selectedLocale.value])

  const stats = computed(() => ({
    localeCount: Object.keys(resumeDocument.value.locales).length,
    educationCount: currentLocaleContent.value.education.length,
    experienceCount: currentLocaleContent.value.experiences.length,
    skillGroupCount: currentLocaleContent.value.skillGroups.length,
    contactCount: currentLocaleContent.value.contacts.length
  }))

  const localeCoverage = computed(() => {
    return Object.values(resumeDocument.value.locales).map(createLocaleCoverage)
  })

  function touchDocument() {
    resumeDocument.value.updatedAt = new Date().toISOString()
  }

  function setPublishStatus(status: PublishStatus) {
    resumeDocument.value.status = status
    touchDocument()
  }

  function addEducation() {
    currentLocaleContent.value.education.push(createEducationItem())
    touchDocument()
  }

  function removeEducation(id: string) {
    currentLocaleContent.value.education = currentLocaleContent.value.education.filter(item => item.id !== id)
    touchDocument()
  }

  function addExperience() {
    currentLocaleContent.value.experiences.push(createExperienceItem())
    touchDocument()
  }

  function removeExperience(id: string) {
    currentLocaleContent.value.experiences = currentLocaleContent.value.experiences.filter(item => item.id !== id)
    touchDocument()
  }

  function addSkillGroup() {
    currentLocaleContent.value.skillGroups.push(createSkillGroup())
    touchDocument()
  }

  function removeSkillGroup(id: string) {
    currentLocaleContent.value.skillGroups = currentLocaleContent.value.skillGroups.filter(item => item.id !== id)
    touchDocument()
  }

  function setSkillGroupItems(id: string, value: string) {
    const group = currentLocaleContent.value.skillGroups.find(item => item.id === id)
    if (!group) {
      return
    }

    group.items = value
      .split('\n')
      .map(item => item.trim())
      .filter(Boolean)

    touchDocument()
  }

  function addContact() {
    currentLocaleContent.value.contacts.push(createContactItem())
    touchDocument()
  }

  function removeContact(id: string) {
    currentLocaleContent.value.contacts = currentLocaleContent.value.contacts.filter(item => item.id !== id)
    touchDocument()
  }

  function saveResume() {
    const baseInfo = currentLocaleContent.value.baseInfo
    if (!baseInfo.fullName.trim() || !baseInfo.headline.trim()) {
      throw createError({
        statusCode: 400,
        statusMessage: '请至少填写姓名和岗位标题'
      })
    }

    touchDocument()
  }

  return {
    resumeDocument,
    selectedLocale,
    localeOptions,
    publishStatusOptions,
    currentLocaleContent,
    stats,
    localeCoverage,
    setPublishStatus,
    addEducation,
    removeEducation,
    addExperience,
    removeExperience,
    addSkillGroup,
    removeSkillGroup,
    setSkillGroupItems,
    addContact,
    removeContact,
    saveResume
  }
}
