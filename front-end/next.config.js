/** @type {import('next').NextConfig} */

const nextConfig = {
  // Tối ưu cho Vercel
  reactStrictMode: true,
  swcMinify: true,

  // ESLint và TypeScript
  eslint: {
    // Tạm thời ignore trong build để tránh lỗi next/babel với IDE
    // ESLint vẫn chạy khi dùng npm run lint
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false, // Bật lại để catch type errors
  },

  // Image optimization cho Vercel
  images: {
    // Vercel tự động optimize images, không cần unoptimized
    unoptimized: false,
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "upanhnhanh.com",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  // Headers cho security và CORS
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
        ],
      },
    ];
  },

  // Compiler optimizations
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
            exclude: ["error", "warn"], // Giữ lại error và warn logs
          }
        : false,
  },

  // Output optimizations
  poweredByHeader: false, // Ẩn X-Powered-By header
  compress: true, // Enable gzip compression
};

module.exports = nextConfig;
