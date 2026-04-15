import '@testing-library/jest-dom/vitest'

function createStorageMock() {
  const storage = new Map<string, string>()

  return {
    getItem(key: string) {
      return storage.get(key) ?? null
    },
    setItem(key: string, value: string) {
      storage.set(key, value)
    },
    removeItem(key: string) {
      storage.delete(key)
    },
    clear() {
      storage.clear()
    },
  }
}

Object.defineProperty(window, 'localStorage', {
  configurable: true,
  value: createStorageMock(),
})
