import { describe, expect, it } from 'vitest'

import {
  appLocales,
  createIndexedRenderKey,
  createRenderKey,
  formatDateRange,
  formatDateTimeByLocale,
  isAppLocale,
  normalizeLocalePathname,
  readLocalizedText,
  toHeroUiLocale,
  toHtmlLang,
} from './index'

describe('@my-resume/utils', () => {
  it('should expose stable locale helpers', () => {
    expect(appLocales).toEqual(['zh', 'en'])
    expect(isAppLocale('zh')).toBe(true)
    expect(isAppLocale('en')).toBe(true)
    expect(isAppLocale('jp')).toBe(false)
    expect(toHtmlLang('zh')).toBe('zh-CN')
    expect(toHeroUiLocale('en')).toBe('en-US')
  })

  it('should normalize locale-prefixed pathnames', () => {
    expect(normalizeLocalePathname('/')).toBe('/')
    expect(normalizeLocalePathname('/zh')).toBe('/')
    expect(normalizeLocalePathname('/en/profile')).toBe('/profile')
    expect(normalizeLocalePathname('/profile')).toBe('/profile')
  })

  it('should read localized text by locale', () => {
    expect(
      readLocalizedText(
        {
          zh: '你好',
          en: 'hello',
        },
        'zh',
      ),
    ).toBe('你好')
  })

  it('should create stable render keys', () => {
    expect(createRenderKey(['  frontend core  ', 'skills', 1])).toBe(
      'frontend-core__skills__1',
    )
    expect(createIndexedRenderKey(3, ['projects', undefined])).toBe('projects__empty__3')
  })

  it('should format date time by locale', () => {
    const dateTime = '2026-04-09T09:33:19.000Z'

    expect(formatDateTimeByLocale(dateTime, 'zh')).toBe(
      new Date(dateTime).toLocaleString('zh-CN', {
        hour12: false,
        timeZone: 'Asia/Shanghai',
      }),
    )
    expect(formatDateTimeByLocale(dateTime, 'en')).toBe(
      new Date(dateTime).toLocaleString('en-US', {
        hour12: false,
        timeZone: 'Asia/Shanghai',
      }),
    )
  })

  it('should format date ranges from shared business items', () => {
    expect(
      formatDateRange({
        endDate: '2026-04',
        startDate: '2024-01',
      }),
    ).toBe('2024-01 - 2026-04')

    expect(
      formatDateRange(
        {
          endDate: '至今',
          startDate: '2024-01',
        },
        'en',
      ),
    ).toBe('2024-01 - Present')

    expect(
      formatDateRange(
        {
          endDate: 'Present',
          startDate: '2024-01',
        },
        'zh',
      ),
    ).toBe('2024-01 - 至今')
  })
})
