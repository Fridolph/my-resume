import { afterEach, describe, expect, it, vi } from 'vitest'

const ORIGINAL_ENV = { ...process.env }

async function importEnvModule() {
  vi.resetModules()
  return import('../env')
}

afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
})

describe('admin env', () => {
  it('should read api base url from public env', async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = 'https://api-admin.example.com'

    const { DEFAULT_API_BASE_URL } = await importEnvModule()

    expect(DEFAULT_API_BASE_URL).toBe('https://api-admin.example.com')
  })

  it('should read public site base url from public env', async () => {
    process.env.NEXT_PUBLIC_WEB_BASE_URL = 'https://resume.example.com'

    const { DEFAULT_PUBLIC_SITE_BASE_URL } = await importEnvModule()

    expect(DEFAULT_PUBLIC_SITE_BASE_URL).toBe('https://resume.example.com')
  })

  it('should fallback api base url and app version defaults', async () => {
    delete process.env.NEXT_PUBLIC_API_BASE_URL
    delete process.env.NEXT_PUBLIC_APP_VERSION
    delete process.env.NEXT_PUBLIC_WEB_BASE_URL

    const {
      APP_VERSION,
      DEFAULT_API_BASE_URL,
      DEFAULT_PUBLIC_SITE_BASE_URL,
    } = await importEnvModule()

    expect(DEFAULT_API_BASE_URL).toBe('http://localhost:5577')
    expect(DEFAULT_PUBLIC_SITE_BASE_URL).toBe('http://localhost:5555')
    expect(APP_VERSION).toBe('0.0.0')
  })

  it('should expose app version from public env', async () => {
    process.env.NEXT_PUBLIC_APP_VERSION = 'v2.2.8'

    const { APP_VERSION } = await importEnvModule()

    expect(APP_VERSION).toBe('v2.2.8')
  })
})
