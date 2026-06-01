import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuth, getAdminFirestore } from '@/lib/firebaseAdmin'
import { encodeSessionCookieToken } from '@/lib/sessionCookieCodec'

export const runtime = 'nodejs'

const COOKIE_OPTS = {
  path: '/',
  maxAge: 3600,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
}

/** POST — verify Firebase ID token and set __session / __role cookies server-side. */
export async function POST(req: NextRequest) {
  let token: string | undefined
  try {
    const body = (await req.json()) as { token?: string }
    token = body.token
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 })
  }

  try {
    const decoded = await getAdminAuth().verifyIdToken(token)
    const userSnap = await getAdminFirestore().collection('users').doc(decoded.uid).get()
    const role = (userSnap.data()?.role as string | undefined) ?? 'user'

    const res = NextResponse.json({ ok: true })
    res.cookies.set('__session', encodeSessionCookieToken(token), COOKIE_OPTS)
    res.cookies.set('__role', role, COOKIE_OPTS)
    return res
  } catch (e) {
    console.error('auth/session POST error', e)
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }
}

/** DELETE — clear session cookies on logout. */
export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set('__session', '', { path: '/', maxAge: 0 })
  res.cookies.set('__role', '', { path: '/', maxAge: 0 })
  return res
}
