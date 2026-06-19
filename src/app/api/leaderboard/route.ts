import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminAuth, getAdminFirestore } from '@/lib/firebaseAdmin'
import { decodeSessionCookieToken } from '@/lib/sessionCookieCodec'
import { rateLimitCheck, rateLimitResponse } from '@/lib/rateLimit'

const MAX_SCORE = 100000
const NAME_MAX = 20

// POST /api/leaderboard — שליחת ניקוד לטבלת מנצחים. גישה אנונימית (לפי מזהה מכשיר),
// שומר את הניקוד הגבוה ביותר. משתמש מחובר מסומן "מאומת".
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anon'
  const rl = await rateLimitCheck(ip, 'leaderboard')
  if (!rl.ok) return rateLimitResponse(rl)

  let body: { scope?: string; name?: string; score?: number; deviceId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const scope = (body.scope ?? '').toString().trim().slice(0, 120)
  const name = (body.name ?? '').toString().trim().replace(/\s+/g, ' ').slice(0, NAME_MAX)
  const score = Math.max(0, Math.min(MAX_SCORE, Math.round(Number(body.score) || 0)))
  const deviceId = (body.deviceId ?? '').toString().trim().slice(0, 80)

  if (!scope || !name || !deviceId) {
    return NextResponse.json({ error: 'נדרשים שם, ניקוד וטבלה' }, { status: 400 })
  }

  // אימות אופציונלי — אם יש סשן תקף, נסמן "מאומת" ונשתמש ב-uid כמפתח
  let userId: string | null = null
  const token = decodeSessionCookieToken(req.cookies.get('__session')?.value)
  if (token) {
    try {
      const decoded = await getAdminAuth().verifyIdToken(token)
      userId = decoded.uid
    } catch { /* anonymous */ }
  }

  const key = userId ?? deviceId
  const docId = `${scope}__${key}`.replace(/[^a-zA-Z0-9_:.\-]/g, '_').slice(0, 1400)

  try {
    const db = getAdminFirestore()
    const ref = db.collection('leaderboard').doc(docId)
    const snap = await ref.get()
    const prevBest = snap.exists ? Number(snap.data()?.score ?? 0) : 0
    const best = Math.max(prevBest, score)

    await ref.set({
      scope,
      name,
      score: best,
      verified: !!userId,
      userId: userId ?? null,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true })

    return NextResponse.json({ ok: true, best })
  } catch (e) {
    console.error('leaderboard POST', e)
    return NextResponse.json({ error: 'Save failed' }, { status: 500 })
  }
}
