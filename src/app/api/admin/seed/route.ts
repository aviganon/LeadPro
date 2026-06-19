import { NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminFirestore } from '@/lib/firebaseAdmin'
import { requireAdminSession } from '@/lib/adminAuth'
import { buildSeedDocs } from '@/lib/seedContent'

// POST /api/admin/seed — זורע תוכן התחלתי (יסודי: חשבון + אנגלית). Idempotent (set/merge על מזהים קבועים).
export async function POST() {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

  try {
    const db = getAdminFirestore()
    const docs = buildSeedDocs()

    // Firestore batch limit is 500 — chunk to be safe.
    const CHUNK = 400
    for (let i = 0; i < docs.length; i += CHUNK) {
      const batch = db.batch()
      for (const d of docs.slice(i, i + CHUNK)) {
        const ref = db.collection(d.collection).doc(d.id)
        batch.set(ref, { ...d.data, updatedAt: FieldValue.serverTimestamp() }, { merge: true })
      }
      await batch.commit()
    }

    return NextResponse.json({ ok: true, created: docs.length })
  } catch (e) {
    console.error('admin/seed', e)
    return NextResponse.json({ error: 'Seed failed' }, { status: 500 })
  }
}
