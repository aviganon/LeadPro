import { NextRequest, NextResponse } from 'next/server'
import { verifyFirebaseIdTokenEdge } from '@/lib/verifyFirebaseIdTokenEdge'
import { decodeSessionCookieToken } from '@/lib/sessionCookieCodec'

const PUBLIC_PATHS = [
  '/auth',
  '/pricing',
  '/manifest.json',
  '/api/billing/webhook',
  '/api/facebook/callback',
  '/api/leads/cron',  // Cloud Scheduler — auth handled inside the route
  '/privacy',
  '/terms',
]

/**
 * הגנה על מסלולים באמצעות JWT בעוגיית __session (Next.js 16: proxy במקום middleware).
 */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isApi = pathname.startsWith('/api/')

  if (!pathname.startsWith('/api') && /\.(ico|png|jpg|jpeg|svg|gif|webp)$/i.test(pathname)) {
    return NextResponse.next()
  }

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return NextResponse.next()
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon')) return NextResponse.next()

  const session = decodeSessionCookieToken(req.cookies.get('__session')?.value)
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
