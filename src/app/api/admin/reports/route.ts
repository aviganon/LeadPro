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
          status: x.status === 'resolved' ? 'resolved' : 'open',
          createdAt: x.createdAt instanceof Timestamp ? x.createdAt.toDate().toISOString() : null,
        }
      })
      .filter((r) => includeResolved || r.status === 'open')
      .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))

    // העשרה בשם המקצוע — קריאה אחת לאוסף המקצועות שמופיעים בדיווחים
    const ids = [...new Set(raw.map((r) => r.subjectId).filter(Boolean))]
    const nameById = new Map<string, string>()
    await Promise.all(ids.map(async (id) => {
      try {
        const s = await db.collection('subjects').doc(id).get()
        if (s.exists) nameById.set(id, (s.data()?.nameHe as string) || (s.data()?.nameEn as string) || id)
      } catch { /* ignore */ }
    }))

    const reports = raw.map((r) => ({ ...r, subjectName: nameById.get(r.subjectId) || r.subjectId || 'לא ידוע' }))

    return NextResponse.json({ reports })
  } catch (e) {
    console.error('admin/reports GET', e)
    return NextResponse.json({ error: 'Failed to load reports' }, { status: 500 })
  }
}

// PATCH /api/admin/reports — סימון דיווח כטופל. body: { id, status }
export async function PATCH(req: NextRequest) {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

  let body: { id?: string; status?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const id = (body.id ?? '').toString().trim()
  const status = body.status === 'open' ? 'open' : 'resolved'
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  try {
    const db = getAdminFirestore()
    await db.collection('question_reports').doc(id).set({ status }, { merge: true })
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
    await db.collection('question_reports').doc(id).delete()
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('admin/reports DELETE', e)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
