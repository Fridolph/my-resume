import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@repo/types': resolve(__dirname, '../../packages/types/src/index.ts'),
      '@repo/database': resolve(__dirname, '../../packages/database/src/index.ts'),
      '@repo/sdk': resolve(__dirname, '../../packages/sdk/src/index.ts')
    }
  },
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    globals: true,
    isolate: false,
    sequence: {
      concurrent: false
    }
  }
})
