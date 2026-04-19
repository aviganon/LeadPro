'use client'

import { auth } from '@/lib/firebase'
import { getUser } from '@/lib/db'
import { encodeSessionCookieToken } from '@/lib/sessionCookieCodec'

/**
 * Writes __session / __role cookies from the current Firebase session.
 * Call this after signIn / signUp and before client navigation so middleware
 * sees a valid JWT on the next request (SessionSync alone can lag one tick).
 */
function cookieOpts(maxAge?: number): string {
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : ''
  const age = maxAge !== undefined ? `; max-age=${maxAge}` : '; max-age=3600'
  return `; path=/${age}; SameSite=Lax${secure}`
}

export async function syncSessionCookies(): Promise<void> {
  const fbUser = auth.currentUser
  if (!fbUser) {
    document.cookie = `__session=; path=/; max-age=0; SameSite=Lax`
    document.cookie = `__role=; path=/; max-age=0; SameSite=Lax`
    return
  }

  const token = await fbUser.getIdToken()
  // Firebase ID tokens expire after 1 hour — set matching max-age so the cookie doesn't outlast the token
  document.cookie = `__session=${encodeSessionCookieToken(token)}${cookieOpts(3600)}`

  const user = await getUser(fbUser.uid)
  if (user) {
    document.cookie = `__role=${user.role}${cookieOpts(3600)}`
  }
}
