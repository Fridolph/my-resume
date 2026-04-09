import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['test/**/*.e2e-spec.ts'],
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage/e2e',
    },
  },
})
