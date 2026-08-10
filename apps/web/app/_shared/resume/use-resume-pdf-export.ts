'use client'

/**
 * HTML 简历 → PDF 导出 composable。
 *
 * 基于 html2pdf.js（html2canvas + jsPDF 封装），
 * 将页面 DOM 直接渲染为 A4 PDF 并触发下载。
 */
type Html2PdfWorker = {
  from: (element: HTMLElement) => Html2PdfWorker
  save: () => Promise<void>
  set: (options: Record<string, unknown>) => Html2PdfWorker
}

type Html2PdfFactory = () => Html2PdfWorker

const MODERN_COLOR_PATTERN = /\b(?:lab|lch|oklch|color-mix)\(/i
const IMAGE_WAIT_TIMEOUT_MS = 3000

const COLOR_FALLBACKS = {
  backgroundColor: '#ffffff',
  borderBottomColor: '#e4e4e7',
  borderColor: '#e4e4e7',
  borderLeftColor: '#e4e4e7',
  borderRightColor: '#e4e4e7',
  borderTopColor: '#e4e4e7',
  color: '#18181b',
  fill: '#18181b',
  outlineColor: '#18181b',
  stroke: '#18181b',
  textDecorationColor: '#18181b',
} as const

const COLOR_PROPERTIES = Object.keys(COLOR_FALLBACKS) as Array<
  keyof typeof COLOR_FALLBACKS
>

const VISUAL_EFFECT_PROPERTIES = ['boxShadow', 'filter', 'textShadow'] as const

export function useResumePdfExport() {
  /**
   * 等待指定容器内所有图片加载完成。
   */
  async function waitForImages(container: HTMLElement): Promise<void> {
    const images = Array.from(container.querySelectorAll('img'))
    const promises = images.map((img) => waitForImage(img))

    await Promise.all(promises)
  }

  /**
   * 导出 A4 PDF。
   *
   * @param element - 要导出的 DOM 元素
   * @param fileName - 下载文件名
   */
  async function exportPdf(
    element: HTMLElement,
    fileName: string,
  ): Promise<void> {
    // 动态导入 html2pdf.js（仅客户端可用）
    const html2pdf = resolveHtml2PdfFactory(await import('html2pdf.js'))

    await waitForImages(element)

    const options = {
      margin: 0,
      filename: fileName,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: {
        backgroundColor: '#ffffff',
        scale: 2,
        scrollX: 0,
        scrollY: 0,
        useCORS: true,
        letterRendering: true,
        /**
         * html2canvas 不支持 CSS lab() / oklch() 颜色函数（Tailwind v4 默认），
         * 在克隆 DOM 后将它们替换为浏览器已计算的实际 RGB 值。
         */
        onclone: (clonedDoc: Document) => {
          const container = clonedDoc.querySelector<HTMLElement>('.review-resume-page')
          if (!container) return
          const clonedWindow = clonedDoc.defaultView
          if (!clonedWindow) return

          sanitizeModernColors(container, clonedWindow)
        },
      },
      pagebreak: {
        mode: ['css', 'legacy'] as const,
        avoid: ['[data-section]', '[data-avoid-break]', '.pdf-keep'],
      },
      jsPDF: {
        unit: 'mm' as const,
        format: 'a4' as const,
        orientation: 'portrait' as const,
      },
    }

    try {
      await html2pdf().set(options).from(element).save()
    } finally {
      cleanupHtml2PdfArtifacts()
    }
  }

  return { exportPdf }
}

async function waitForImage(img: HTMLImageElement): Promise<void> {
  if (img.complete) return

  const loadPromise =
    typeof img.decode === 'function'
      ? img.decode().catch(() => undefined)
      : new Promise<void>((resolve) => {
          img.addEventListener('load', () => resolve(), { once: true })
          img.addEventListener('error', () => resolve(), { once: true })
        })

  await Promise.race([
    loadPromise,
    new Promise<void>((resolve) => {
      window.setTimeout(resolve, IMAGE_WAIT_TIMEOUT_MS)
    }),
  ])
}

function resolveHtml2PdfFactory(moduleValue: unknown): Html2PdfFactory {
  if (typeof moduleValue === 'function') {
    return moduleValue as Html2PdfFactory
  }

  if (moduleValue && typeof moduleValue === 'object') {
    const candidate = (moduleValue as { default?: unknown }).default
    if (typeof candidate === 'function') {
      return candidate as Html2PdfFactory
    }
  }

  throw new Error('PDF 生成器加载失败，请刷新页面后重试')
}

function sanitizeModernColors(container: HTMLElement, clonedWindow: Window) {
  const elements = [container, ...Array.from(container.querySelectorAll<HTMLElement>('*'))]

  elements.forEach((element) => {
    const computedStyle = clonedWindow.getComputedStyle(element)

    COLOR_PROPERTIES.forEach((propertyName) => {
      const propertyValue = computedStyle[propertyName]

      if (hasUnsupportedColor(propertyValue)) {
        element.style[propertyName] = COLOR_FALLBACKS[propertyName]
      }
    })

    VISUAL_EFFECT_PROPERTIES.forEach((propertyName) => {
      const propertyValue = computedStyle[propertyName]

      if (hasUnsupportedColor(propertyValue)) {
        element.style[propertyName] = 'none'
      }
    })

    sanitizeSvgPaintAttribute(element, 'fill')
    sanitizeSvgPaintAttribute(element, 'stroke')
  })
}

function hasUnsupportedColor(value: string | null | undefined): boolean {
  return Boolean(value && MODERN_COLOR_PATTERN.test(value))
}

function sanitizeSvgPaintAttribute(element: HTMLElement, attributeName: 'fill' | 'stroke') {
  const value = element.getAttribute(attributeName)

  if (hasUnsupportedColor(value)) {
    element.setAttribute(attributeName, COLOR_FALLBACKS[attributeName])
  }
}

function cleanupHtml2PdfArtifacts() {
  document
    .querySelectorAll('.html2pdf__container, .html2canvas-container')
    .forEach((node) => node.remove())
}
