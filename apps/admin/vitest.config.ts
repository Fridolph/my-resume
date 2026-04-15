import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
      '@core': fileURLToPath(new URL('./app/_core', import.meta.url)),
      '@i18n': fileURLToPath(new URL('./i18n', import.meta.url)),
      '@shared': fileURLToPath(new URL('./app/_shared', import.meta.url)),
    },
  },
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
})
