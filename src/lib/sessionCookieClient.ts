'use client'

import { auth } from '@/lib/firebase'
import { getUser } from '@/lib/db'
import { encodeSessionCookieToken } from '@/lib/sessionCookieCodec'

/**
 * Writes __session / __role cookies from the current Firebase session.
 * Call this after signIn / signUp and before client navigation so middleware
 * sees a valid JWT on the next request (SessionSync alone can lag one tick).
 */
export async function syncSessionCookies(): Promise<void> {
  const fbUser = auth.currentUser
  if (!fbUser) {
    document.cookie = '__session=; path=/; max-age=0'
    document.cookie = '__role=; path=/; max-age=0'
    return
  }

  const token = await fbUser.getIdToken()
  document.cookie = `__session=${encodeSessionCookieToken(token)}; path=/; SameSite=Lax`

  const user = await getUser(fbUser.uid)
  if (user) {
    document.cookie = `__role=${user.role}; path=/; SameSite=Lax`
  }
}
