import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  expect: {
    timeout: 5_000
  },
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:3100',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    headless: true,
    channel: 'chrome'
  },
  webServer: [
    {
      command: 'pnpm --dir ../api-server dev',
      url: 'http://127.0.0.1:3011/api/health',
      reuseExistingServer: true,
      timeout: 120_000
    },
    {
      command: 'NUXT_PUBLIC_PUBLIC_API_BASE_URL=http://127.0.0.1:3011/api/public pnpm build && NITRO_HOST=0.0.0.0 NITRO_PORT=3100 NUXT_PUBLIC_PUBLIC_API_BASE_URL=http://127.0.0.1:3011/api/public pnpm preview',
      url: 'http://127.0.0.1:3100',
      reuseExistingServer: true,
      timeout: 180_000
    }
  ]
})
