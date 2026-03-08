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
    baseURL: 'http://127.0.0.1:3200',
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
      command: 'NITRO_HOST=0.0.0.0 NITRO_PORT=3200 NUXT_PUBLIC_ADMIN_API_BASE_URL=http://127.0.0.1:3011/api/admin pnpm build && NITRO_HOST=0.0.0.0 NITRO_PORT=3200 NUXT_PUBLIC_ADMIN_API_BASE_URL=http://127.0.0.1:3011/api/admin pnpm preview',
      url: 'http://127.0.0.1:3200',
      reuseExistingServer: true,
      timeout: 180_000
    }
  ]
})
