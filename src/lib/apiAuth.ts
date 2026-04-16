import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuth } from '@/lib/firebaseAdmin'

export type ApiAuthOk = { ok: true; uid: string }
export type ApiAuthFail = { ok: false; response: NextResponse }
export type ApiAuthResult = ApiAuthOk | ApiAuthFail

/**
 * Verifies the Firebase ID token from the `__session` cookie (set by SessionSync).
 * Use on API routes after middleware, or when middleware is bypassed.
 */
export async function verifyApiAuth(req: NextRequest): Promise<ApiAuthResult> {
  const token = req.cookies.get('__session')?.value
  if (!token) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  try {
    const decoded = await getAdminAuth().verifyIdToken(token)
    return { ok: true, uid: decoded.uid }
  } catch {
    return { ok: false, response: NextResponse.json({ error: 'Invalid session' }, { status: 401 }) }
  }
}

/**
 * Ensures the authenticated user matches the `userId` claimed in the request (body or query).
 */
export function requireMatchingUser(sessionUid: string, claimedUserId: string | null): ApiAuthResult {
  if (!claimedUserId) {
    return { ok: false, response: NextResponse.json({ error: 'Missing userId' }, { status: 400 }) }
  }
  if (claimedUserId !== sessionUid) {
    return { ok: false, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { ok: true, uid: sessionUid }
}
