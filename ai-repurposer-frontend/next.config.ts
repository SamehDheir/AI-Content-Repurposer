import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Emits a self-contained server bundle so the Docker runtime stage does not
  // need node_modules.
  output: 'standalone',
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
