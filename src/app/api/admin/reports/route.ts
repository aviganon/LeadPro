import { NextRequest, NextResponse } from 'next/server'
import { Timestamp } from 'firebase-admin/firestore'
import { getAdminFirestore } from '@/lib/firebaseAdmin'
import { requireAdminSession } from '@/lib/adminAuth'

// GET /api/admin/reports — רשימת דיווחי שאלות (ברירת מחדל: פתוחים בלבד).
export async function GET(req: NextRequest) {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

  const url = new URL(req.url)
  const includeResolved = url.searchParams.get('all') === '1'

  try {
    const db = getAdminFirestore()
    const snap = await db.collection('question_reports').limit(500).get()
    const raw = snap.docs
      .map((d) => {
        const x = d.data()
        return {
          id: d.id,
          questionId: x.questionId ?? '',
          subjectId: x.subjectId ?? '',
          grade: typeof x.grade === 'number' ? x.grade : 0,
          prompt: x.prompt ?? '',
          reason: x.reason ?? '',
          topic: x.topic ?? '',
          needsReview: x.needsReview === true,
          status: x.status === 'resolved' ? 'resolved' : 'open',
          createdAt: x.createdAt instanceof Timestamp ? x.createdAt.toDate().toISOString() : null,
        }
      })
      .filter((r) => includeResolved || r.status === 'open')
      .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))

    // העשרה בשם המקצוע
    const ids = [...new Set(raw.map((r) => r.subjectId).filter(Boolean))]
    const nameById = new Map<string, string>()
    await Promise.all(ids.map(async (id) => {
      try {
        const s = await db.collection('subjects').doc(id).get()
        if (s.exists) nameById.set(id, (s.data()?.nameHe as string) || (s.data()?.nameEn as string) || id)
      } catch { /* ignore */ }
    }))

    // העשרה בשדות השאלה הנוכחיים (לעריכה) — קריאה אחת לכל שאלה ייחודית
    const qids = [...new Set(raw.map((r) => r.questionId).filter((q) => q && !q.startsWith('ai-')))]
    const qById = new Map<string, { options: string[]; answer: string; explanation: string; difficulty: number; topic: string }>()
    await Promise.all(qids.map(async (qid) => {
      try {
        const s = await db.collection('questions').doc(qid).get()
        if (s.exists) {
          const d = s.data() ?? {}
          qById.set(qid, {
            options: Array.isArray(d.options) ? d.options : [],
            answer: typeof d.answer === 'string' ? d.answer : '',
            explanation: typeof d.explanation === 'string' ? d.explanation : '',
            difficulty: typeof d.difficulty === 'number' ? d.difficulty : 2,
            topic: typeof d.topic === 'string' ? d.topic : '',
          })
        }
      } catch { /* ignore */ }
    }))

    const reports = raw.map((r) => {
      const q = qById.get(r.questionId)
      return {
        ...r,
        subjectName: nameById.get(r.subjectId) || r.subjectId || 'לא ידוע',
        topic: r.topic || q?.topic || '',
        options: q?.options ?? [],
        answer: q?.answer ?? '',
        explanation: q?.explanation ?? '',
        difficulty: q?.difficulty ?? 2,
      }
    })

    return NextResponse.json({ reports })
  } catch (e) {
    console.error('admin/reports GET', e)
    return NextResponse.json({ error: 'Failed to load reports' }, { status: 500 })
  }
}

interface EditFields { prompt?: string; options?: string[]; answer?: string; explanation?: string; difficulty?: number; topic?: string }

// PATCH /api/admin/reports
//  • עריכה:  { id, action: 'edit', question: {...} } — מעדכן את השאלה עצמה
//  • טיפול:  { id, status: 'resolved'|'open' } — מחזיר/מסיר את השאלה מהמאגר
export async function PATCH(req: NextRequest) {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

  let body: { id?: string; status?: string; action?: string; question?: EditFields }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const id = (body.id ?? '').toString().trim()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  try {
    const db = getAdminFirestore()
    const ref = db.collection('question_reports').doc(id)
    const reportSnap = await ref.get()
    const qId = reportSnap.data()?.questionId as string | undefined

    // ===== עריכת השאלה =====
    if (body.action === 'edit') {
      const q = body.question ?? {}
      if (!qId || qId.startsWith('ai-')) return NextResponse.json({ error: 'השאלה אינה ניתנת לעריכה' }, { status: 400 })
      const options = (q.options ?? []).map((o) => String(o).trim()).filter(Boolean)
      const answer = String(q.answer ?? '').trim()
      const prompt = String(q.prompt ?? '').trim()
      if (!prompt || options.length < 2) return NextResponse.json({ error: 'נדרשים ניסוח ולפחות 2 אפשרויות' }, { status: 400 })
      if (!options.includes(answer)) return NextResponse.json({ error: 'התשובה חייבת להיות זהה לאחת האפשרויות' }, { status: 400 })
      const diff = q.difficulty === 1 || q.difficulty === 3 ? q.difficulty : 2
      const topic = String(q.topic ?? '').trim()
      await db.collection('questions').doc(qId).set({
        prompt, options, answer, explanation: String(q.explanation ?? '').trim(), difficulty: diff, topic,
      }, { merge: true })
      // שיקוף הניסוח/הנושא בדיווח עצמו
      await ref.set({ prompt, topic }, { merge: true })
      return NextResponse.json({ ok: true })
    }

    // ===== טיפול בדיווח =====
    const status = body.status === 'open' ? 'open' : 'resolved'
    await ref.set({ status }, { merge: true })
    if (status === 'resolved' && qId && !qId.startsWith('ai-')) {
      // אישור → השאלה חוזרת למאגר וכבר אינה "לבדיקה"
      try { await db.collection('questions').doc(qId).set({ reportedHidden: false, needsReview: false }, { merge: true }) } catch { /* ignore */ }
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('admin/reports PATCH', e)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}

// DELETE /api/admin/reports?id=... — מחיקת דיווח
export async function DELETE(req: NextRequest) {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

  const id = new URL(req.url).searchParams.get('id')?.trim()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  try {
    const db = getAdminFirestore()
    const ref = db.collection('question_reports').doc(id)
    // מחיקת הדיווח → השאלה חוזרת למאגר (אלא אם הוסרה בכוונה דרך ניהול התוכן)
    const qId = (await ref.get()).data()?.questionId as string | undefined
    if (qId && !qId.startsWith('ai-')) {
      try { await db.collection('questions').doc(qId).set({ reportedHidden: false }, { merge: true }) } catch { /* ignore */ }
    }
    await ref.delete()
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('admin/reports DELETE', e)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
