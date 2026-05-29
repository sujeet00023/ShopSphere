/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['via.placeholder.com', 'localhost'],
    unoptimized: true,
  },
  webpack: (config) => {
    return config
  },
}

module.exports = nextConfig
