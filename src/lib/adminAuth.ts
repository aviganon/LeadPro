import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getAdminAuth, getAdminFirestore } from '@/lib/firebaseAdmin'
import { decodeSessionCookieToken } from '@/lib/sessionCookieCodec'

export async function requireAdminSession(): Promise<
  { ok: true; adminUid: string } | { ok: false; response: NextResponse }
> {
  const cookieStore = await cookies()
  const session = decodeSessionCookieToken(cookieStore.get('__session')?.value)
  if (!session) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  try {
    const decoded = await getAdminAuth().verifyIdToken(session)
    const doc = await getAdminFirestore().collection('users').doc(decoded.uid).get()
    const role = doc.data()?.role
    if (!doc.exists || role !== 'admin') {
      return { ok: false, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
    }
    return { ok: true, adminUid: decoded.uid }
  } catch {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
}
