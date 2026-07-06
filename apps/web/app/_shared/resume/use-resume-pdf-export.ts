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
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait' as const,
      },
    }

    await html2pdf().set(options).from(element).save()
  }

  return { exportPdf }
}
