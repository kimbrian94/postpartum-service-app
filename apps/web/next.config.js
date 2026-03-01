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
  
  // Smart caching strategy
  async headers() {
    return [
      {
        // Static assets: cache forever (they have unique hashes)
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // HTML pages: always check for updates on refresh
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
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