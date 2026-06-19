import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminAuth, getAdminFirestore } from '@/lib/firebaseAdmin'
import { decodeSessionCookieToken } from '@/lib/sessionCookieCodec'
import { rateLimitCheck, rateLimitResponse } from '@/lib/rateLimit'

// POST /api/presence — פעימת לב לנוכחות בזמן אמת. ציבורי (אנונימי לפי מזהה מכשיר),
// משתמש מחובר מסומן "מאומת". נכתב בשרת (Admin SDK).
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anon'
  const rl = await rateLimitCheck(ip, 'presence')
  if (!rl.ok) return rateLimitResponse(rl)

  let body: { deviceId?: string; name?: string; page?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const deviceId = (body.deviceId ?? '').toString().trim().slice(0, 80)
  if (!deviceId) return NextResponse.json({ error: 'Missing deviceId' }, { status: 400 })

  const page = (body.page ?? '').toString().slice(0, 80)
  let clientName = (body.name ?? '').toString().trim().slice(0, 40)

  // אימות אופציונלי — סשן תקף => "מאומת" + מפתח לפי uid
  let userId: string | null = null
  const token = decodeSessionCookieToken(req.cookies.get('__session')?.value)
  if (token) {
    try {
      const decoded = await getAdminAuth().verifyIdToken(token)
      userId = decoded.uid
    } catch { /* anonymous */ }
  }
  if (!userId) clientName = '' // לאנונימי אין שם

  const key = (userId ?? deviceId).replace(/[^a-zA-Z0-9_:.\-]/g, '_').slice(0, 200)

  try {
    await getAdminFirestore().collection('presence').doc(key).set({
      deviceId,
      userId: userId ?? null,
      verified: !!userId,
      name: clientName || null,
      page,
      lastSeen: FieldValue.serverTimestamp(),
    }, { merge: true })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('presence POST', e)
    return NextResponse.json({ error: 'Save failed' }, { status: 500 })
  }
}
