import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    optimizePackageImports: ['@heroui/react'],
  },
}

const withNextIntl = createNextIntlPlugin('./app/_core/i18n/request.ts')

export default withNextIntl(nextConfig)
