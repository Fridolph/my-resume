import type { NextConfig } from 'next'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dirname = path.dirname(fileURLToPath(import.meta.url))

const nextConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.join(dirname, '../..'),
  experimental: {
    // antd 按需 tree-shaking，减小首屏体积
    optimizePackageImports: ['antd', '@ant-design/icons'],
  },
}

export default nextConfig
