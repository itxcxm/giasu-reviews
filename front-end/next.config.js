/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed output: 'export' to support dynamic routes with API data
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
};

module.exports = nextConfig;
