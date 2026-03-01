/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  
  // Use Railway's git commit SHA for reliable build identification
  generateBuildId: async () => {
    const buildId = process.env.RAILWAY_GIT_COMMIT_SHA || `local-${Date.now()}`;
    console.log(`[Build] Build ID: ${buildId}`);
    return buildId;
  },
  
  // Aggressive no-cache strategy
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
    ];
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