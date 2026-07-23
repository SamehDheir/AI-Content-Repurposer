import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Enable production optimizations
  compress: true,
  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  // Turbopack config (Next.js 16+)
  turbopack: {},
};

export default nextConfig;
