import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Avoid picking a parent monorepo lockfile when one exists above this app.
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Remotion Player + web-renderer (admin Social reels).
  transpilePackages: [
    'remotion',
    '@remotion/player',
    '@remotion/web-renderer',
    '@remotion/transitions',
    '@remotion/media',
  ],
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
