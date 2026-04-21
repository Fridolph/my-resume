import { describe, expect, it } from 'vitest'

import { resolvePdfFontPath } from '../resume-pdf-fonts'

describe('resolvePdfFontPath', () => {
  it('should return null for english locale', () => {
    const result = resolvePdfFontPath('en', () => true, {
      PDF_CJK_FONT_PATH: '/custom/fonts/zh.ttf',
    })

    expect(result).toBeNull()
  })

  it('should use configured font path when available', () => {
    const configuredPath = '/custom/fonts/NotoSansSC-Regular.otf'
    const result = resolvePdfFontPath(
      'zh',
      (path) => path === configuredPath,
      {
        PDF_CJK_FONT_PATH: configuredPath,
      },
    )

    expect(result).toBe(configuredPath)
  })

  it('should fall back to default cjk font candidates', () => {
    const fallbackPath = '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'
    const result = resolvePdfFontPath(
      'zh',
      (path) => path === fallbackPath,
      {},
    )

    expect(result).toBe(fallbackPath)
  })
})
