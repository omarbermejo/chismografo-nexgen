import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['animal-avatar-generator'],
  experimental: {
    viewTransition: true,
  },
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
