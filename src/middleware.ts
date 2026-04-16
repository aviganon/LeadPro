import { NextRequest, NextResponse } from 'next/server'
import { verifyFirebaseIdTokenEdge } from '@/lib/verifyFirebaseIdTokenEdge'

const PUBLIC_PATHS = [
  '/auth',
  '/pricing',
  '/manifest.json',
  '/api/billing/webhook',
  '/api/facebook/callback',
]

/**
 * Protects routes using the Firebase ID token stored in the __session cookie (set by SessionSync).
 * Middleware runs on the Edge runtime: we verify the JWT with jose + Google's JWKS — the same
 * cryptographic validation firebase-admin uses for ID tokens. firebase-admin itself is Node-only.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isApi = pathname.startsWith('/api/')

  // Static assets from /public — must not require auth (landing page images, icons, etc.)
  if (!pathname.startsWith('/api') && /\.(ico|png|jpg|jpeg|svg|gif|webp)$/i.test(pathname)) {
    return NextResponse.next()
  }

  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) return NextResponse.next()
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon')) return NextResponse.next()

  const session = req.cookies.get('__session')?.value
  if (!session) {
    if (isApi) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const loginUrl = new URL('/auth', req.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  try {
    await verifyFirebaseIdTokenEdge(session)
  } catch {
    if (isApi) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }
    const loginUrl = new URL('/auth', req.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
