/** @type {import('next').NextConfig} */
const nextConfig = {
  // Avoid stale webpack chunk references when route handlers change during dev.
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;
