import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminFirestore } from '@/lib/firebaseAdmin'
import { rateLimitCheck, rateLimitResponse } from '@/lib/rateLimit'

// POST /api/report-question — דיווח אנונימי על שאלה בעייתית.
// נשמר ב-question_reports (כתיבה דרך Admin SDK בלבד). מוגבל בקצב לפי IP.
const REASON_MAX = 300
const PROMPT_MAX = 600

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anon'
  const rl = await rateLimitCheck(ip, 'report')
  if (!rl.ok) return rateLimitResponse(rl)

  let body: { subjectId?: string; grade?: number; questionId?: string; prompt?: string; reason?: string; deviceId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const questionId = (body.questionId ?? '').toString().trim().slice(0, 200)
  const subjectId = (body.subjectId ?? '').toString().trim().slice(0, 200)
  const grade = Number.isFinite(body.grade) ? Number(body.grade) : 0
  const prompt = (body.prompt ?? '').toString().trim().slice(0, PROMPT_MAX)
  const reason = (body.reason ?? '').toString().trim().slice(0, REASON_MAX)
  const deviceId = (body.deviceId ?? '').toString().trim().slice(0, 80)

  if (!questionId || !subjectId) {
    return NextResponse.json({ error: 'נדרשת שאלה ומקצוע' }, { status: 400 })
  }

  // מזהה דטרמיניסטי לפי שאלה+מכשיר — מונע ספאם של אותו מדווח על אותה שאלה.
  const docId = `${questionId}__${deviceId || ip}`.replace(/[^a-zA-Z0-9_:.\-]/g, '_').slice(0, 1400)

  try {
    const db = getAdminFirestore()
    await db.collection('question_reports').doc(docId).set({
      questionId, subjectId, grade, prompt, reason,
      deviceId: deviceId || null,
      status: 'open',
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    }, { merge: true })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('report-question POST', e)
    return NextResponse.json({ error: 'Save failed' }, { status: 500 })
  }
}
