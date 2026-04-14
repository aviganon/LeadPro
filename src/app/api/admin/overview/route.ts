import type { Firestore } from 'firebase-admin/firestore'
import { NextResponse } from 'next/server'
import { Timestamp } from 'firebase-admin/firestore'
import { getAdminFirestore } from '@/lib/firebaseAdmin'
import { requireAdminSession } from '@/lib/adminAuth'

function startOfToday(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

export async function GET() {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

  const db = getAdminFirestore()

  try {
    const usersSnap = await db.collection('users').limit(500).get()

    const users = await Promise.all(
      usersSnap.docs.map(async (docSnap) => {
        const id = docSnap.id
        const d = docSnap.data()
        const [leadsAgg, postsAgg] = await Promise.all([
          db.collection('leads').where('userId', '==', id).count().get(),
          db.collection('posts').where('userId', '==', id).count().get(),
        ])
        return {
          id,
          name: typeof d.name === 'string' ? d.name : '',
          email: typeof d.email === 'string' ? d.email : '',
          plan: d.plan ?? 'free',
          vertical: d.vertical ?? 'general',
          isActive: d.isActive !== false,
          facebookConnected: !!d.facebookConnected,
          leadsCount: leadsAgg.data().count,
          postsCount: postsAgg.data().count,
          createdAt:
            d.createdAt instanceof Timestamp ? d.createdAt.toDate().toISOString() : null,
        }
      })
    )

    const t0 = Timestamp.fromDate(startOfToday())

    const [totalLeadsAgg, totalPostsAgg, leadsTodayAgg, postsTodayAgg, convertedAgg] =
      await Promise.all([
        db.collection('leads').count().get(),
        db.collection('posts').count().get(),
        db.collection('leads').where('createdAt', '>=', t0).count().get(),
        db.collection('posts').where('createdAt', '>=', t0).count().get(),
        countConvertedLeads(db),
      ])

    const totalLeads = totalLeadsAgg.data().count
    const totalPosts = totalPostsAgg.data().count
    const leadsToday = leadsTodayAgg.data().count
    const postsToday = postsTodayAgg.data().count
    const converted = convertedAgg

    const conversionRate =
      totalLeads > 0 ? Math.round((converted / totalLeads) * 1000) / 10 : 0

    return NextResponse.json({
      users,
      aggregate: {
        totalLeads,
        totalPosts,
        leadsToday,
        postsToday,
        conversionRate,
      },
    })
  } catch (e) {
    console.error('admin/overview', e)
    return NextResponse.json({ error: 'Failed to load admin data' }, { status: 500 })
  }
}

async function countConvertedLeads(db: Firestore): Promise<number> {
  try {
    const snap = await db.collection('leads').where('status', '==', 'converted').count().get()
    return snap.data().count
  } catch {
    return 0
  }
}
