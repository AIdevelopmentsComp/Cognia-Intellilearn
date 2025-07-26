/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  reactStrictMode: true,
  trailingSlash: true,
  images: { 
    unoptimized: true,
    domains: ['localhost', 'firebasestorage.googleapis.com'],
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname),
    }
    return config
  },
  async headers() {
    return [
      {
        source: '/favicon.ico',
        headers: [
          {
            key: 'Content-Type',
            value: 'image/x-icon',
          },
        ],
      },
      {
        source: '/faviconcognia.jpeg',
        headers: [
          {
            key: 'Content-Type',
            value: 'image/jpeg',
          },
        ],
      },
    ]
  },
  env: {
    AWS_ACCESS_KEY_ID: 'AKIAVI3ULX4ZB3253Q6R',
    AWS_SECRET_ACCESS_KEY: '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',
    AWS_REGION: 'us-east-1'
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  }
}

module.exports = nextConfig