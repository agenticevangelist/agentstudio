/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Allow importing modules from outside the frontend directory (e.g., ../src)
    externalDir: true,
  },
  eslint: {
    // Ignore ESLint errors during production builds
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
