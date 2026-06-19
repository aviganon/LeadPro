import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminFirestore } from '@/lib/firebaseAdmin'
import { requireAdminSession } from '@/lib/adminAuth'

// POST /api/admin/structure — יצירת מבנה: מוסד / מסלול / קורס(מקצוע).
// body: { kind: 'institution'|'department'|'subject', data: {...} }
export async function POST(req: NextRequest) {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

  let body: { kind?: string; data?: Record<string, unknown> }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { kind, data } = body
  if (!data || typeof data !== 'object') {
    return NextResponse.json({ error: 'Missing data' }, { status: 400 })
  }

  const db = getAdminFirestore()
  const str = (v: unknown, max = 120) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
  const num = (v: unknown, d: number) => (Number.isFinite(Number(v)) ? Number(v) : d)

  try {
    if (kind === 'institution') {
      const name = str(data.name)
      if (!name) return NextResponse.json({ error: 'נדרש שם מוסד' }, { status: 400 })
      const type = data.type === 'university' ? 'university' : 'college'
      const ref = await db.collection('institutions').add({
        name, type, order: num(data.order, Date.now() % 100000), updatedAt: FieldValue.serverTimestamp(),
      })
      return NextResponse.json({ ok: true, id: ref.id })
    }

    if (kind === 'department') {
      const institutionId = str(data.institutionId)
      const name = str(data.name)
      if (!institutionId || !name) return NextResponse.json({ error: 'נדרשים מוסד ושם מסלול' }, { status: 400 })
      const ref = await db.collection('departments').add({
        institutionId, name, order: num(data.order, Date.now() % 100000), updatedAt: FieldValue.serverTimestamp(),
      })
      return NextResponse.json({ ok: true, id: ref.id })
    }

    if (kind === 'subject') {
      const nameHe = str(data.nameHe)
      const slug = str(data.slug).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '')
      if (!nameHe || !slug) return NextResponse.json({ error: 'נדרשים שם וכתובת (slug)' }, { status: 400 })
      const doc: Record<string, unknown> = {
        slug,
        level: ['elementary', 'middle_high', 'student'].includes(String(data.level)) ? data.level : 'student',
        nameHe,
        nameEn: str(data.nameEn) || nameHe,
        icon: str(data.icon, 40) || 'BookOpen',
        color: str(data.color, 20) || '#7C3AED',
        gradeFrom: num(data.gradeFrom, 1),
        gradeTo: num(data.gradeTo, num(data.gradeFrom, 1)),
        order: num(data.order, Date.now() % 100000),
        updatedAt: FieldValue.serverTimestamp(),
      }
      if (data.institutionId) doc.institutionId = str(data.institutionId)
      if (data.departmentId) doc.departmentId = str(data.departmentId)
      const ref = await db.collection('subjects').add(doc)
      return NextResponse.json({ ok: true, id: ref.id })
    }

    return NextResponse.json({ error: 'Unknown kind' }, { status: 400 })
  } catch (e) {
    console.error('admin/structure', e)
    return NextResponse.json({ error: 'Create failed' }, { status: 500 })
  }
}

const COLLECTION_BY_KIND: Record<string, string> = {
  institution: 'institutions',
  department: 'departments',
  subject: 'subjects',
}

// DELETE /api/admin/structure?kind=&id= — מחיקת מוסד / מסלול / קורס.
export async function DELETE(req: NextRequest) {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

  const kind = req.nextUrl.searchParams.get('kind') ?? ''
  const id = req.nextUrl.searchParams.get('id') ?? ''
  const coll = COLLECTION_BY_KIND[kind]
  if (!coll || !id) return NextResponse.json({ error: 'Missing kind/id' }, { status: 400 })

  try {
    const db = getAdminFirestore()
    await db.collection(coll).doc(id).delete()
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('admin/structure DELETE', e)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
