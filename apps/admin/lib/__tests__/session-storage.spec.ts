import { afterEach, describe, expect, it } from 'vitest'

import { clearAccessToken, readAccessToken, writeAccessToken } from '../session-storage'

describe('session storage', () => {
  afterEach(() => {
    localStorage.clear()
  })

  it('should persist and read access token from localStorage', () => {
    writeAccessToken('demo-token')

    expect(readAccessToken()).toBe('demo-token')
  })

  it('should clear access token from localStorage', () => {
    writeAccessToken('demo-token')

    clearAccessToken()

    expect(readAccessToken()).toBeNull()
  })
})
