import { existsSync } from 'node:fs'

import type { ResumeLocale } from './domain/standard-resume'

const CJK_FONT_CANDIDATE_PATHS = [
  '/System/Library/Fonts/Supplemental/Arial Unicode.ttf',
  '/System/Library/Fonts/Supplemental/NISC18030.ttf',
  '/Library/Fonts/Arial Unicode.ttf',
  '/usr/share/fonts/opentype/noto/NotoSansSC-Regular.otf',
  '/usr/share/fonts/opentype/noto/NotoSansCJKsc-Regular.otf',
  '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',
  '/usr/share/fonts/opentype/noto/NotoSerifCJK-Regular.ttc',
  '/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc',
  '/usr/share/fonts/opentype/adobe-source-han-sans/SourceHanSansSC-Regular.otf',
  '/usr/share/fonts/opentype/source-han-sans/SourceHanSansSC-Regular.otf',
  '/usr/share/fonts/truetype/arphic/uming.ttf',
  '/usr/share/fonts/truetype/arphic/ukai.ttf',
  '/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc',
  'C:\\Windows\\Fonts\\arialuni.ttf',
  'C:\\Windows\\Fonts\\msyh.ttf',
  'C:\\Windows\\Fonts\\simhei.ttf',
  'C:\\Windows\\Fonts\\simsun.ttf',
] as const

/**
 * 解析 PDF 导出所需的 CJK 字体文件
 *
 * @param locale 导出语言
 * @param fileExists 文件存在判断函数
 * @returns 可用字体路径，英文导出或未找到时返回 null
 */
export function resolvePdfFontPath(
  locale: ResumeLocale,
  fileExists: (path: string) => boolean = existsSync,
  env: NodeJS.ProcessEnv = process.env,
) {
  if (locale === 'en') {
    return null
  }

  const configuredPath = env.PDF_CJK_FONT_PATH?.trim() || env.RESUME_PDF_CJK_FONT_PATH?.trim() || null

  if (configuredPath && fileExists(configuredPath)) {
    return configuredPath
  }

  return CJK_FONT_CANDIDATE_PATHS.find((path) => fileExists(path)) ?? null
}
