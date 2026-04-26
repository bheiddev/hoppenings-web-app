import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Crawlers and browsers often request /favicon.ico; serve our icon (static file in public/).
      { source: '/favicon.ico', destination: '/icon.png', permanent: false },
      { source: '/boulder', destination: '/boulder-longmont', permanent: true },
      { source: '/boulder/:path*', destination: '/boulder-longmont/:path*', permanent: true },
      { source: '/longmont', destination: '/boulder-longmont', permanent: true },
      { source: '/longmont/:path*', destination: '/boulder-longmont/:path*', permanent: true },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.in',
      },
    ],
  },
};

export default nextConfig;
