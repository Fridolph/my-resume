'use client'

/**
 * HTML 简历 → PDF 导出 composable。
 *
 * 基于 html2pdf.js（html2canvas + jsPDF 封装），
 * 将页面 DOM 直接渲染为 A4 PDF 并触发下载。
 */
export function useResumePdfExport() {
  /**
   * 等待指定容器内所有图片加载完成。
   */
  async function waitForImages(container: HTMLElement): Promise<void> {
    const images = Array.from(container.querySelectorAll('img'))
    const promises = images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve()
          } else {
            img.onload = () => resolve()
            img.onerror = () => resolve() // 失败也继续，不阻塞
          }
        }),
    )

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
    const html2pdf = (await import('html2pdf.js')).default

    await waitForImages(element)

    const options = {
      margin: 0,
      filename: fileName,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        /**
         * html2canvas 不支持 CSS lab() / oklch() 颜色函数（Tailwind v4 默认），
         * 在克隆 DOM 后将它们替换为浏览器已计算的实际 RGB 值。
         */
        onclone: (clonedDoc: Document) => {
          const container = clonedDoc.querySelector('.review-resume-page')
          if (!container) return
          // 将可能含 lab()/oklch() 的元素强制重绘为计算后的 RGB 颜色
          const all = container.querySelectorAll('*')
          all.forEach((el) => {
            const htmlEl = el as HTMLElement
            const style = getComputedStyle(htmlEl)
            // 只在颜色疑似为现代色彩空间时覆盖
            const bg = style.backgroundColor
            const fg = style.color
            if (bg && (bg.includes('lab(') || bg.includes('oklch('))) {
              htmlEl.style.backgroundColor = bg
            }
            if (fg && (fg.includes('lab(') || fg.includes('oklch('))) {
              htmlEl.style.color = fg
            }
          })
        },
      },
      jsPDF: {
        unit: 'mm' as const,
        format: 'a4' as const,
        orientation: 'portrait' as const,
      },
    }

    await html2pdf().set(options as any).from(element).save()
  }

  return { exportPdf }
}
