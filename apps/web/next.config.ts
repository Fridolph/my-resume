import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@my-resume/api-client', '@my-resume/ui'],
};

export default nextConfig;
