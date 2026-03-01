/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  // Force new build ID to invalidate all caches
  generateBuildId: async () => {
    const buildId = 'deploy-' + Date.now();
    console.log(`[Build] Generating new Build ID: ${buildId}`); // Logs to Railway Build Logs
    return buildId;;
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