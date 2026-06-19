import { NextResponse } from 'next/server'
import { Timestamp } from 'firebase-admin/firestore'
import { getAdminFirestore } from '@/lib/firebaseAdmin'
import { requireAdminSession } from '@/lib/adminAuth'

export async function GET() {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

  const db = getAdminFirestore()

  try {
    const usersSnap = await db.collection('users').limit(500).get()

    const users = usersSnap.docs.map((docSnap) => {
      const id = docSnap.id
      const d = docSnap.data()
      return {
        id,
        name: typeof d.name === 'string' ? d.name : '',
        email: typeof d.email === 'string' ? d.email : '',
        plan: d.plan ?? 'free',
        role: d.role === 'admin' ? 'admin' : 'user',
        isActive: d.isActive !== false,
        createdAt:
          d.createdAt instanceof Timestamp ? d.createdAt.toDate().toISOString() : null,
      }
    })

    const [subjectsAgg, questionsAgg, gamesAgg, materialsAgg] = await Promise.all([
      db.collection('subjects').count().get(),
      db.collection('questions').count().get(),
      db.collection('games').count().get(),
      db.collection('materials').count().get(),
    ])

    return NextResponse.json({
      users,
      aggregate: {
        totalUsers: users.length,
        totalSubjects: subjectsAgg.data().count,
        totalQuestions: questionsAgg.data().count,
        totalGames: gamesAgg.data().count,
        totalMaterials: materialsAgg.data().count,
      },
    })
  } catch (e) {
    console.error('admin/overview', e)
    return NextResponse.json({ error: 'Failed to load admin data' }, { status: 500 })
  }
}
