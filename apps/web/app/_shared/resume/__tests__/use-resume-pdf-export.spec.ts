import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useResumePdfExport } from '../use-resume-pdf-export'

const pdfChain = vi.hoisted(() => {
  const chain = {
    from: vi.fn(),
    save: vi.fn(),
    set: vi.fn(),
  }
  chain.set.mockReturnValue(chain)
  chain.from.mockReturnValue(chain)
  chain.save.mockResolvedValue(undefined)
  return chain
})

const html2pdfMock = vi.hoisted(() => vi.fn(() => pdfChain))

vi.mock('html2pdf.js', () => ({
  default: html2pdfMock,
}))

beforeEach(() => {
  html2pdfMock.mockClear()
  pdfChain.set.mockClear()
  pdfChain.from.mockClear()
  pdfChain.save.mockReset()
  pdfChain.set.mockReturnValue(pdfChain)
  pdfChain.from.mockReturnValue(pdfChain)
  pdfChain.save.mockResolvedValue(undefined)
  document.body.innerHTML = ''
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('useResumePdfExport', () => {
  it('should export an A4 pdf after preparing html2pdf options', async () => {
    const element = document.createElement('div')
    element.className = 'review-resume-page'
    const image = document.createElement('img')
    Object.defineProperty(image, 'complete', {
      configurable: true,
      value: true,
    })
    element.append(image)

    const { result } = renderHook(() => useResumePdfExport())

    await result.current.exportPdf(element, 'resume.pdf')

    expect(html2pdfMock).toHaveBeenCalledTimes(1)
    expect(pdfChain.set).toHaveBeenCalledWith(
      expect.objectContaining({
        filename: 'resume.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait',
        },
        pagebreak: {
          mode: ['css', 'legacy'],
          avoid: ['[data-section]', '[data-avoid-break]', '.pdf-keep'],
        },
      }),
    )
    expect(pdfChain.set.mock.calls[0]?.[0].html2canvas).toEqual(
      expect.objectContaining({
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
      }),
    )
    expect(pdfChain.from).toHaveBeenCalledWith(element)
    expect(pdfChain.save).toHaveBeenCalledTimes(1)
  })

  it('should sanitize modern color functions before html2canvas renders the cloned document', async () => {
    const element = document.createElement('div')
    element.className = 'review-resume-page'
    const { result } = renderHook(() => useResumePdfExport())

    await result.current.exportPdf(element, 'resume.pdf')

    const options = pdfChain.set.mock.calls[0]?.[0]
    const onclone = options?.html2canvas?.onclone as ((doc: Document) => void) | undefined
    const clonedContainer = document.createElement('div')
    clonedContainer.className = 'review-resume-page'
    clonedContainer.setAttribute('fill', 'oklch(0.5 0.1 120)')
    clonedContainer.setAttribute('stroke', 'lab(50 0 0)')
    document.body.append(clonedContainer)

    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      backgroundColor: 'oklch(0.98 0.01 250)',
      borderBottomColor: 'rgb(228, 228, 231)',
      borderColor: 'rgb(228, 228, 231)',
      borderLeftColor: 'rgb(228, 228, 231)',
      borderRightColor: 'rgb(228, 228, 231)',
      borderTopColor: 'lch(90 5 260)',
      boxShadow: '0 4px 20px lab(20 0 0 / 0.12)',
      color: 'lab(20 0 0)',
      fill: 'oklch(0.5 0.1 120)',
      filter: 'color-mix(in oklch, black 10%, white)',
      outlineColor: 'rgb(24, 24, 27)',
      stroke: 'lab(20 0 0)',
      textDecorationColor: 'rgb(24, 24, 27)',
      textShadow: 'none',
    } as CSSStyleDeclaration)

    onclone?.(document)

    expect(clonedContainer.style.backgroundColor).toBe('rgb(255, 255, 255)')
    expect(clonedContainer.style.borderTopColor).toBe('rgb(228, 228, 231)')
    expect(clonedContainer.style.boxShadow).toBe('none')
    expect(clonedContainer.style.color).toBe('rgb(24, 24, 27)')
    expect(clonedContainer.style.filter).toBe('none')
    expect(clonedContainer.getAttribute('fill')).toBe('#18181b')
    expect(clonedContainer.getAttribute('stroke')).toBe('#18181b')
  })

  it('should continue exporting when an image decode hangs until timeout', async () => {
    vi.useFakeTimers()
    const element = document.createElement('div')
    element.className = 'review-resume-page'
    const image = document.createElement('img')
    Object.defineProperty(image, 'complete', {
      configurable: true,
      value: false,
    })
    Object.defineProperty(image, 'decode', {
      configurable: true,
      value: vi.fn(() => new Promise<void>(() => undefined)),
    })
    element.append(image)
    const { result } = renderHook(() => useResumePdfExport())

    const exportPromise = result.current.exportPdf(element, 'resume.pdf')
    await vi.advanceTimersByTimeAsync(3000)
    await exportPromise

    expect(image.decode).toHaveBeenCalledTimes(1)
    expect(pdfChain.save).toHaveBeenCalledTimes(1)
  })

  it('should cleanup html2pdf artifacts when export fails', async () => {
    const element = document.createElement('div')
    element.className = 'review-resume-page'
    const artifact = document.createElement('div')
    artifact.className = 'html2pdf__container'
    document.body.append(artifact)
    pdfChain.save.mockRejectedValueOnce(new Error('html2pdf failed'))
    const { result } = renderHook(() => useResumePdfExport())

    await expect(result.current.exportPdf(element, 'resume.pdf')).rejects.toThrow(
      'html2pdf failed',
    )

    expect(document.querySelector('.html2pdf__container')).toBeNull()
  })
})
