import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Simple config for now to check if it's the webpack prop causing issues with Turbopack
  transpilePackages: ['react-konva', 'konva'],
};

export default nextConfig;
