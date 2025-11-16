/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };
    // Note: Multiple Three.js instances warning may still appear from pose-viewer dependency.
    // This is a known issue and doesn't affect functionality.
    return config;
  },
};

export default nextConfig;
