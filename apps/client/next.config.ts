import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@maison-amane/api', '@maison-amane/shared-kernel'],
}

export default nextConfig
