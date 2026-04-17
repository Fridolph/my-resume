import { afterEach, describe, expect, it, vi } from 'vitest'

const ORIGINAL_ENV = { ...process.env }

async function importEnvModule() {
  vi.resetModules()
  return import('../env')
}

afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
})

describe('web env', () => {
  it('should use NEXT_PUBLIC api base url for client-facing default', async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = 'https://api-resume.example.com'
    process.env.RESUME_API_BASE_URL = 'http://server:5577'

    const {
      DEFAULT_API_BASE_URL,
      DEFAULT_PUBLIC_API_BASE_URL,
      DEFAULT_SERVER_API_BASE_URL,
    } = await importEnvModule()

    expect(DEFAULT_PUBLIC_API_BASE_URL).toBe('https://api-resume.example.com')
    expect(DEFAULT_API_BASE_URL).toBe('https://api-resume.example.com')
    expect(DEFAULT_SERVER_API_BASE_URL).toBe('http://server:5577')
  })

  it('should fallback to localhost when no env is provided', async () => {
    delete process.env.NEXT_PUBLIC_API_BASE_URL
    delete process.env.RESUME_API_BASE_URL

    const {
      DEFAULT_API_BASE_URL,
      DEFAULT_PUBLIC_API_BASE_URL,
      DEFAULT_SERVER_API_BASE_URL,
    } = await importEnvModule()

    expect(DEFAULT_PUBLIC_API_BASE_URL).toBe('http://localhost:5577')
    expect(DEFAULT_API_BASE_URL).toBe('http://localhost:5577')
    expect(DEFAULT_SERVER_API_BASE_URL).toBe('http://localhost:5577')
  })
})
