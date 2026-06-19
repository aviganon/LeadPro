import type { NextConfig } from 'next'

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

const nextConfig: NextConfig = {
  output: 'standalone',
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      // מסמכי HTML תלויים במצב המשתמש (הרשמה/ברוך הבא) ומתעדכנים בכל פריסה —
      // לא לאפשר ל-CDN/edge להגיש דף ישן. נכסים עם hash (_next) נשארים cached.
      {
        source: '/((?!_next/).*)',
        headers: [{ key: 'Cache-Control', value: 'no-store, must-revalidate' }],
      },
    ]
  },
  experimental: {
    serverActions: { allowedOrigins: ['localhost:3000'] },
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.fbcdn.net' },
      { protocol: 'https', hostname: 'graph.facebook.com' },
    ],
  },
}

export default nextConfig
