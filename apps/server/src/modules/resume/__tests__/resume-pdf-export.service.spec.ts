import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createExampleStandardResume } from '../domain/standard-resume'
import { ResumePdfExportService } from '../resume-pdf-export.service'

const setContentMock = vi.hoisted(() => vi.fn())
const launchMock = vi.hoisted(() => vi.fn())

vi.mock('puppeteer', () => ({
  default: {
    launch: launchMock,
  },
}))

describe('ResumePdfExportService', () => {
  const service = new ResumePdfExportService()
  const originalExecutablePath = process.env.PUPPETEER_EXECUTABLE_PATH

  beforeEach(() => {
    setContentMock.mockClear()
    launchMock.mockClear()
    launchMock.mockResolvedValue({
      close: vi.fn(),
      newPage: vi.fn().mockResolvedValue({
        close: vi.fn(),
        pdf: vi.fn().mockResolvedValue(
          Buffer.from('%PDF-mock-puppeteer-output'),
        ),
        setContent: setContentMock,
      }),
    })
  })

  afterEach(() => {
    if (originalExecutablePath === undefined) {
      delete process.env.PUPPETEER_EXECUTABLE_PATH
      return
    }
    process.env.PUPPETEER_EXECUTABLE_PATH = originalExecutablePath
  })

  it('should render the published resume into a pdf buffer', async () => {
    const resume = createExampleStandardResume()
    const pdfBuffer = await service.render(resume, 'zh')

    expect(pdfBuffer.byteLength).toBeGreaterThan(10)
    expect(pdfBuffer.toString('utf8')).toContain('%PDF')
    expect(setContentMock).toHaveBeenCalledWith(
      expect.stringContaining('font-size: 18px; font-weight: 700; color: #333;'),
      { waitUntil: 'load' },
    )
    expect(setContentMock).toHaveBeenCalledWith(
      expect.stringContaining('@page { size: A4 portrait; margin: 10mm 0; }'),
      { waitUntil: 'load' },
    )
    expect(setContentMock).toHaveBeenCalledWith(
      expect.stringContaining('.skills-item + .skills-item { margin-top: 12px; }'),
      { waitUntil: 'load' },
    )
    expect(setContentMock).toHaveBeenCalledWith(
      expect.stringContaining(
        'href="https://resume.fridolph.top" target="_blank"',
      ),
      { waitUntil: 'load' },
    )
  })

  it('should render English locale as well', async () => {
    const resume = createExampleStandardResume()
    const pdfBuffer = await service.render(resume, 'en')

    expect(pdfBuffer.byteLength).toBeGreaterThan(10)
    expect(setContentMock).toHaveBeenCalledWith(
      expect.stringContaining('<h2>Key Strengths</h2>'),
      { waitUntil: 'load' },
    )
  })

  it('should use the configured browser executable when provided', async () => {
    process.env.PUPPETEER_EXECUTABLE_PATH = '/custom/chrome'

    await service.render(createExampleStandardResume(), 'zh')

    expect(launchMock).toHaveBeenCalledWith(
      expect.objectContaining({ executablePath: '/custom/chrome' }),
    )
  })
})
