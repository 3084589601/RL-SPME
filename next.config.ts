import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "3gb",
    },
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: "/uploads/:path*",
        destination: "/api/uploads/:path*",
      },
    ];
  },
  async headers() {
    const cache = [
      { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
    ];
    return [
      { source: "/uploads/:path*", headers: cache },
      { source: "/轮播图片/:path*", headers: cache },
      { source: "/精彩瞬间/:path*", headers: cache },
      { source: "/荣誉证书/:path*", headers: cache },
      { source: "/实验室LOGO/:path*", headers: cache },
    ];
  },
  webpack: (config, { dev }) => {
    if (!dev) config.cache = false;
    return config;
  },
};

export default nextConfig;
