import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { getUserGroups } from '@/lib/facebook'
import { getAdminFirestore } from '@/lib/firebaseAdmin'
import { getFacebookAccessTokenForUser } from '@/lib/fbAccessToken'
import type { FacebookGroup } from '@/types'

// GET /api/facebook/groups?userId=xxx
// Returns saved groups (or fetches fresh from FB if forceRefresh=1)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  const forceRefresh = searchParams.get('forceRefresh') === '1'

  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

  try {
    const db = getAdminFirestore()

    if (forceRefresh) {
      const tokenData = await getFacebookAccessTokenForUser(userId)
      if (!tokenData) return NextResponse.json({ error: 'Not connected' }, { status: 401 })

      const fbGroups = await getUserGroups(tokenData.accessToken)
      const existingSnap = await db.collection('fb_groups').doc(userId).get()
      const existing = (existingSnap.data()?.groups ?? []) as FacebookGroup[]
      const existingMap = new Map(existing.map(g => [g.id, g.isSelected]))

      const merged = fbGroups.map(g => ({
        id: g.id,
        name: g.name,
        memberCount: g.member_count,
        privacy: (g.privacy ?? 'CLOSED') as 'OPEN' | 'CLOSED' | 'SECRET',
        isSelected: existingMap.get(g.id) ?? false,
      }))

      await db.collection('fb_groups').doc(userId).set({
        userId,
        groups: merged,
        lastSynced: FieldValue.serverTimestamp(),
      })

      return NextResponse.json({ groups: merged, synced: true })
    }

    const snap = await db.collection('fb_groups').doc(userId).get()
    const groups = (snap.data()?.groups ?? []) as FacebookGroup[]
    return NextResponse.json({ groups })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 })
  }
}

// PATCH /api/facebook/groups
// Toggle group selection for a user
export async function PATCH(req: NextRequest) {
  try {
    const { userId, groupId, selected } = await req.json()
    if (!userId || !groupId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const db = getAdminFirestore()
    const ref = db.collection('fb_groups').doc(userId)
    const snap = await ref.get()
    const groups = ((snap.data()?.groups ?? []) as FacebookGroup[]).map(g =>
      g.id === groupId ? { ...g, isSelected: selected } : g
    )

    await ref.set(
      {
        userId,
        groups,
        lastSynced: FieldValue.serverTimestamp(),
      },
      { merge: true }
    )

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 })
  }
}
