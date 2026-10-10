/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@safestep/shared'],
  ...(process.env.BUILD_STANDALONE === 'true' ? { output: 'standalone' } : {}),
  reactStrictMode: true,
}

module.exports = nextConfig
