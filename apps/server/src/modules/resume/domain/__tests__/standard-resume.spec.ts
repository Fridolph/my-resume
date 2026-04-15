import { describe, expect, it } from 'vitest'

import {
  createEmptyLocalizedText,
  createEmptyStandardResume,
  createExampleStandardResume,
  getStandardResumeModuleKeys,
  isLocalizedText,
  normalizeStandardResume,
  validateStandardResume,
} from '../standard-resume'

describe('standard resume domain', () => {
  it('should expose stable module boundaries for the standard resume', () => {
    expect(getStandardResumeModuleKeys()).toEqual([
      'profile',
      'education',
      'experiences',
      'projects',
      'skills',
      'highlights',
    ])
  })

  it('should create an empty bilingual resume skeleton', () => {
    const resume = createEmptyStandardResume()

    expect(resume.meta.defaultLocale).toBe('zh')
    expect(resume.meta.locales).toEqual(['zh', 'en'])
    expect(resume.profile.fullName).toEqual({
      zh: '',
      en: '',
    })
    expect(resume.profile.hero.frontImageUrl).toBe('/img/avatar.jpg')
    expect(resume.profile.hero.slogans).toHaveLength(2)
    expect(resume.education).toEqual([])
    expect(resume.experiences).toEqual([])
    expect(resume.projects).toEqual([])
    expect(resume.skills).toEqual([])
    expect(resume.highlights).toEqual([])
  })

  it('should keep localized text objects strict and bilingual', () => {
    expect(isLocalizedText(createEmptyLocalizedText())).toBe(true)
    expect(isLocalizedText({ zh: '你好', en: 'Hello' })).toBe(true)
    expect(isLocalizedText({ zh: '只有中文' })).toBe(false)
    expect(isLocalizedText({ zh: '你好', en: 'Hello', ja: 'こんにちは' })).toBe(false)
  })

  it('should validate a complete standard resume example', () => {
    const resume = createExampleStandardResume()

    expect(validateStandardResume(resume)).toEqual({
      valid: true,
      errors: [],
    })
    expect(resume.profile.headline.zh).toContain('AI Agent')
    expect(resume.profile.hero.linkUrl).toBe('https://github.com/Fridolph/my-resume')
    expect(resume.experiences[0]?.companyName.zh).toBe('成都澳昇能源科技有限责任公司')
    expect(resume.projects.some((item) => item.name.zh === 'GreenSketch')).toBe(true)
    expect(resume.skills.map((item) => item.name.zh)).toEqual([
      '前端核心能力',
      '工程化与性能优化',
      'AI Agent 开发',
      '架构设计与技术方案',
      '全栈开发能力',
      '业务理解与产品化落地',
    ])
    expect(resume.skills.map((item) => item.proficiency)).toEqual([95, 88, 73, 90, 77, 86])
  })

  it('should reject invalid bilingual content shapes', () => {
    const resume = createExampleStandardResume() as ReturnType<
      typeof createExampleStandardResume
    > & {
      profile: {
        fullName: { zh: string }
      }
    }

    resume.profile.fullName = {
      zh: '付寅生',
    }

    expect(validateStandardResume(resume)).toEqual({
      valid: false,
      errors: ['profile.fullName must be a localized text object'],
    })
  })

  it('should validate all standard resume module structures', () => {
    const resume = createExampleStandardResume()

    resume.profile.links.push({
      label: {
        zh: '项目仓库',
        en: 'Repository',
      },
      url: 'https://github.com/Fridolph/my-resume',
      icon: 'ri:github-fill',
    })

    expect(validateStandardResume(resume)).toEqual({
      valid: true,
      errors: [],
    })
  })

  it('should normalize legacy resumes when hero config is missing', () => {
    const resume = createExampleStandardResume() as ReturnType<
      typeof createExampleStandardResume
    > & {
      profile: Omit<ReturnType<typeof createExampleStandardResume>['profile'], 'hero'> & {
        hero?: undefined
      }
    }

    delete resume.profile.hero

    const normalized = normalizeStandardResume(resume)

    expect(normalized.profile.hero.frontImageUrl).toBe('/img/avatar.jpg')
    expect(normalized.profile.hero.backImageUrl).toBe('/img/avatar2.jpg')
    expect(normalized.profile.hero.slogans).toHaveLength(2)
  })

  it('should normalize legacy projects when coreFunctions is missing', () => {
    const resume = createExampleStandardResume() as ReturnType<
      typeof createExampleStandardResume
    > & {
      projects: Array<
        Omit<
          ReturnType<typeof createExampleStandardResume>['projects'][number],
          'coreFunctions'
        > & {
          coreFunctions?: undefined
        }
      >
    }

    delete resume.projects[0].coreFunctions

    const normalized = normalizeStandardResume(resume)

    expect(normalized.projects[0]?.coreFunctions).toEqual({
      zh: '',
      en: '',
    })
  })

  it('should normalize legacy interests into labeled interest items', () => {
    const resume = createExampleStandardResume() as ReturnType<
      typeof createExampleStandardResume
    > & {
      profile: Omit<
        ReturnType<typeof createExampleStandardResume>['profile'],
        'interests'
      > & {
        interests: Array<{ zh: string; en: string }>
      }
    }

    resume.profile.interests = [
      {
        zh: '羽毛球',
        en: 'Badminton',
      },
    ]

    const normalized = normalizeStandardResume(resume)

    expect(normalized.profile.interests).toEqual([
      {
        label: {
          zh: '羽毛球',
          en: 'Badminton',
        },
      },
    ])
  })

  it('should reject invalid module arrays and nested field shapes', () => {
    const resume = createExampleStandardResume() as ReturnType<
      typeof createExampleStandardResume
    > & {
      profile: {
        links: Array<{ label: { zh: string }; url: number }>
        interests: Array<{ label: { zh: string }; icon: number }> | string
      }
      education: string
      experiences: Array<{ technologies: string }>
      projects: Array<{ links: string; technologies: string[] }>
      skills: Array<{ keywords: string; name: { zh: string } }>
      highlights: Array<{ title: { zh: string }; description: { zh: string } }>
    }

    resume.profile.links = [
      {
        label: {
          zh: '只写中文',
        },
        url: 123,
        icon: 1,
      },
    ]
    resume.profile.interests = [
      {
        label: {
          zh: '只写中文',
        },
        icon: 123,
      },
    ]
    resume.education = 'education' as unknown as string
    resume.experiences = [
      {
        technologies: 'Vue 3',
      },
    ]
    resume.projects = [
      {
        links: 'https://example.com',
        technologies: ['Vue 3'],
      },
    ]
    resume.skills = [
      {
        keywords: 'TypeScript',
        name: {
          zh: '前端工程化',
        },
      },
    ]
    resume.highlights = [
      {
        title: {
          zh: '技术写作',
        },
        description: {
          zh: '持续输出',
        },
      },
    ]

    expect(validateStandardResume(resume)).toEqual({
      valid: false,
      errors: [
        'profile.links[0].label must be a localized text object',
        'profile.links[0].url must be a string',
        'profile.links[0].icon must be a string when provided',
        'profile.interests[0].label must be a localized text object',
        'profile.interests[0].icon must be a string when provided',
        'education must be an array',
        'experiences[0].companyName must be a localized text object',
        'experiences[0].role must be a localized text object',
        'experiences[0].employmentType must be a localized text object',
        'experiences[0].location must be a localized text object',
        'experiences[0].summary must be a localized text object',
        'experiences[0].highlights must be an array',
        'experiences[0].technologies must be a string array',
        'projects[0].name must be a localized text object',
        'projects[0].role must be a localized text object',
        'projects[0].summary must be a localized text object',
        'projects[0].coreFunctions must be a localized text object',
        'projects[0].highlights must be an array',
        'projects[0].links must be an array',
        'skills[0].name must be a localized text object',
        'skills[0].keywords must be a string array',
        'highlights[0].title must be a localized text object',
        'highlights[0].description must be a localized text object',
      ],
    })
  })
})
