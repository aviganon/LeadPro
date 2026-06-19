import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminFirestore } from '@/lib/firebaseAdmin'
import { requireAdminSession } from '@/lib/adminAuth'

interface IncomingCourse {
  number?: string
  nameHe?: string
  year?: number
  semester?: 'a' | 'b' | 'both'
}

// POST /api/admin/import-courses — יבוא קורסים למסלול (idempotent, מזהה דטרמיניסטי לפי מספר קורס).
// body: { departmentId, institutionId?, courses: [{ number, nameHe, year, semester }] }
export async function POST(req: NextRequest) {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

  let body: { departmentId?: string; institutionId?: string; courses?: IncomingCourse[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const departmentId = (body.departmentId ?? '').toString().trim()
  const institutionId = (body.institutionId ?? '').toString().trim()
  const courses = Array.isArray(body.courses) ? body.courses : []
  if (!departmentId || courses.length === 0) {
    return NextResponse.json({ error: 'Missing departmentId or courses' }, { status: 400 })
  }

  try {
    const db = getAdminFirestore()
    const batch = db.batch()
    let n = 0
    for (const c of courses) {
      const number = (c.number ?? '').toString().trim()
      const nameHe = (c.nameHe ?? '').toString().trim().slice(0, 160)
      if (!number || !nameHe) continue
      const year = Number.isFinite(c.year) ? Number(c.year) : 1
      const semester = c.semester === 'a' || c.semester === 'b' || c.semester === 'both' ? c.semester : 'both'
      const docId = `${departmentId}__${number}`
      const slug = `crs-${departmentId}-${number}`.toLowerCase().replace(/[^a-z0-9-]+/g, '-')
      const ref = db.collection('subjects').doc(docId)
      batch.set(ref, {
        slug,
        level: 'student',
        nameHe,
        nameEn: nameHe,
        icon: 'BookOpen',
        color: '#7C3AED',
        gradeFrom: year,
        gradeTo: year,
        order: Number(number) || 0,
        institutionId: institutionId || null,
        departmentId,
        semester,
        courseNumber: number,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true })
      n++
    }
    await batch.commit()
    return NextResponse.json({ ok: true, imported: n })
  } catch (e) {
    console.error('admin/import-courses', e)
    return NextResponse.json({ error: 'Import failed' }, { status: 500 })
  }
}
