import type { NextConfig } from 'next';

// Base URL of the NestJS API. In dev this is http://localhost:4000.
const API_URL = process.env.API_URL ?? 'http://localhost:4000';

const nextConfig: NextConfig = {
  // This app is its own root (monorepo has a root lockfile for the dev runner).
  // Use the config's own directory so the root is correct no matter what cwd
  // the dev server is launched from (e.g. the root `npm run dev` runner).
  turbopack: { root: __dirname },
  // Proxy /api/* to the NestJS backend so the browser stays same-origin with
  // the web app — auth cookies are first-party (SameSite=Lax), no CORS needed.
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${API_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
