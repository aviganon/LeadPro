import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminFirestore } from '@/lib/firebaseAdmin'
import { requireAdminSession } from '@/lib/adminAuth'
import type { ContentPack } from '@/lib/contentPacks'

// POST /api/admin/import-content — מייבא חבילת תוכן (שאלות/משחקים/חומרי עזר) לקורס.
// body: { subjectId, grade, pack }. Idempotent — מזהים דטרמיניסטיים לפי subjectId.
export async function POST(req: NextRequest) {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

  let body: { subjectId?: string; grade?: number; pack?: ContentPack }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const subjectId = (body.subjectId ?? '').toString().trim()
  const grade = Number.isFinite(body.grade) ? Number(body.grade) : 1
  const pack = body.pack
  if (!subjectId || !pack) {
    return NextResponse.json({ error: 'Missing subjectId or pack' }, { status: 400 })
  }

  try {
    const db = getAdminFirestore()
    const batch = db.batch()
    let count = 0

    // Questions
    ;(pack.questions ?? []).forEach((q, i) => {
      if (!q.prompt || !Array.isArray(q.options) || !q.answer) return
      const ref = db.collection('questions').doc(`${subjectId}-q-${i}`)
      batch.set(ref, {
        subjectId, level: 'student', grade, lang: 'he', type: 'mc',
        prompt: q.prompt, options: q.options, answer: q.answer,
        explanation: q.explanation ?? '', difficulty: q.difficulty ?? 2,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true })
      count++
    })

    // Quiz game (uses the question bank automatically)
    if ((pack.questions ?? []).length > 0) {
      batch.set(db.collection('games').doc(`${subjectId}-game-quiz`), {
        subjectId, type: 'quiz', level: 'student', grade,
        titleHe: 'חידון', titleEn: 'Quiz', config: {},
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true })
      count++
    }

    // Flashcards game
    if ((pack.flashcards ?? []).length > 0) {
      batch.set(db.collection('games').doc(`${subjectId}-game-flashcards`), {
        subjectId, type: 'flashcards', level: 'student', grade,
        titleHe: 'כרטיסיות', titleEn: 'Flashcards',
        config: { cards: pack.flashcards },
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true })
      count++
    }

    // Memory game
    if ((pack.memory ?? []).length > 0) {
      batch.set(db.collection('games').doc(`${subjectId}-game-memory`), {
        subjectId, type: 'memory', level: 'student', grade,
        titleHe: 'זיכרון', titleEn: 'Memory',
        config: { pairs: pack.memory },
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true })
      count++
    }

    // Materials
    ;(pack.materials ?? []).forEach((m, i) => {
      if (!m.title) return
      batch.set(db.collection('materials').doc(`${subjectId}-mat-${i}`), {
        subjectId, level: 'student', grade, lang: 'he',
        title: m.title, bodyMarkdown: m.bodyMarkdown ?? '', order: i,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true })
      count++
    })

    await batch.commit()
    return NextResponse.json({ ok: true, imported: count })
  } catch (e) {
    console.error('admin/import-content', e)
    return NextResponse.json({ error: 'Import failed' }, { status: 500 })
  }
}
