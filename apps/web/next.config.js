/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  // Force new build ID to invalidate all caches
  generateBuildId: async () => {
    // Use Railway commit SHA or timestamp
    return process.env.RAILWAY_GIT_COMMIT_SHA || `build-${Date.now()}`;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  experimental: {
    turbo: {
      root: path.resolve(__dirname, '../..'),
    },
  },
};

module.exports = nextConfig;