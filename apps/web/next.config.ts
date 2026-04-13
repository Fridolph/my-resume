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

const withNextIntl = createNextIntlPlugin()

export default withNextIntl(nextConfig)
