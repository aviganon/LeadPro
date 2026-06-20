import { NextResponse } from 'next/server'
import type { Firestore, Query } from 'firebase-admin/firestore'
import { Timestamp, AggregateField } from 'firebase-admin/firestore'
import { getAdminFirestore } from '@/lib/firebaseAdmin'
import { requireAdminSession } from '@/lib/adminAuth'

// ספירה עמידה לכשל — אם נכשלת, מחזירה 0 ולא מפילה את כל הבקשה.
async function safeCount(q: Query): Promise<number> {
  try {
    const r = await q.count().get()
    return r.data().count
  } catch (e) {
    console.error('overview count failed', e)
    return 0
  }
}

async function safeAi(db: Firestore) {
  try {
    const r = await db.collection('ai_usage').aggregate({
      cost: AggregateField.sum('costUsd'),
      inTok: AggregateField.sum('inputTokens'),
      outTok: AggregateField.sum('outputTokens'),
      calls: AggregateField.count(),
    }).get()
    const d = r.data()
    return { calls: d.calls ?? 0, cost: d.cost ?? 0, inTok: d.inTok ?? 0, outTok: d.outTok ?? 0 }
  } catch (e) {
    console.error('overview ai aggregate failed', e)
    return { calls: 0, cost: 0, inTok: 0, outTok: 0 }
  }
}

export async function GET() {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

  const db = getAdminFirestore()

  try {
    // המשתמשים — החלק החיוני; אם זה נכשל, מחזירים שגיאה.
    const usersSnap = await db.collection('users').limit(1000).get()
    const users = usersSnap.docs.map((docSnap) => {
      const d = docSnap.data()
      return {
        id: docSnap.id,
        name: typeof d.name === 'string' ? d.name : '',
        email: typeof d.email === 'string' ? d.email : '',
        plan: d.plan ?? 'free',
        role: d.role === 'admin' ? 'admin' : 'user',
        isActive: d.isActive !== false,
        createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate().toISOString() : null,
      }
    })

    // כל שאר הספירות — עמידות לכשל (לא יפילו את טעינת המשתמשים)
    const [totalSubjects, totalQuestions, totalGames, totalMaterials, anonPlayers, openReports, ai] =
      await Promise.all([
        safeCount(db.collection('subjects')),
        safeCount(db.collection('questions')),
        safeCount(db.collection('games')),
        safeCount(db.collection('materials')),
        // שחקנים אנונימיים (לא רשומים) שצברו ניקוד
        safeCount(db.collection('leaderboard').where('verified', '==', false)),
        // דיווחי שאלות פתוחים
        safeCount(db.collection('question_reports').where('status', '==', 'open')),
        safeAi(db),
      ])

    const registered = users.length
    const activeRegistered = users.filter((u) => u.isActive).length

    return NextResponse.json({
      users,
      aggregate: {
        totalUsers: registered,
        registeredUsers: registered,
        activeRegistered,
        anonPlayers,
        totalSubjects,
        totalQuestions,
        totalGames,
        totalMaterials,
        openReports,
        aiCalls: ai.calls,
        aiCostUsd: ai.cost,
        aiInputTokens: ai.inTok,
        aiOutputTokens: ai.outTok,
      },
    })
  } catch (e) {
    console.error('admin/overview', e)
    return NextResponse.json({ error: 'Failed to load admin data' }, { status: 500 })
  }
}
