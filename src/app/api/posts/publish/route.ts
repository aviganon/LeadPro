import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { publishToMultipleGroups } from '@/lib/facebook'
import { getAdminFirestore } from '@/lib/firebaseAdmin'
import { getFacebookAccessTokenForUser } from '@/lib/fbAccessToken'
import { verifyApiAuth, requireMatchingUser } from '@/lib/apiAuth'
import { rateLimitCheck, rateLimitResponse } from '@/lib/rateLimit'

// POST /api/posts/publish
// Body: { userId, postId?, body, groupIds, scheduledAt? }
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyApiAuth(req)
    if (!auth.ok) return auth.response

    const { userId, body, groupIds, scheduledAt } = await req.json()

    const own = requireMatchingUser(auth.uid, typeof userId === 'string' ? userId : null)
    if (!own.ok) return own.response

    if (!body || !groupIds?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const rl = await rateLimitCheck(userId, 'publish')
    if (!rl.ok) return rateLimitResponse(rl)

    const tokenData = await getFacebookAccessTokenForUser(userId)
    if (!tokenData) {
      return NextResponse.json({ error: 'Facebook not connected' }, { status: 401 })
    }
    const { accessToken, tokenExpiry } = tokenData

    if (tokenExpiry && tokenExpiry < new Date()) {
      return NextResponse.json({ error: 'Facebook token expired' }, { status: 401 })
    }

    const db = getAdminFirestore()
    const postRef = await db.collection('posts').add({
      userId,
      vertical: 'general',
      body,
      groupIds,
      status: scheduledAt ? 'scheduled' : 'queued',
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      retryCount: 0,
      facebookPostIds: {},
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })
    const postId = postRef.id

    if (scheduledAt) {
      return NextResponse.json({ success: true, postId, status: 'scheduled' })
    }

    await postRef.update({ status: 'queued', updatedAt: FieldValue.serverTimestamp() })

    const results = await publishToMultipleGroups(accessToken, groupIds, body, 5000)

    const published: Record<string, string> = {}
    const failures: { groupId: string; error: string }[] = []

    for (const r of results) {
      if (r.success && r.fbPostId) {
        published[r.groupId] = r.fbPostId
      } else {
        failures.push({ groupId: r.groupId, error: r.error ?? 'Unknown' })
      }
    }

    const allFailed = Object.keys(published).length === 0
    const status = allFailed ? 'failed' : 'published'

    await postRef.update({
      status,
      facebookPostIds: published,
      publishedAt: allFailed ? null : FieldValue.serverTimestamp(),
      failedReason: allFailed ? failures[0]?.error : null,
      updatedAt: FieldValue.serverTimestamp(),
    })

    if (!allFailed) {
      const statsRef = db.collection('user_stats').doc(userId)
      await statsRef.set(
        {
          userId,
          totalPosts: FieldValue.increment(1),
          postsThisMonth: FieldValue.increment(1),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      )
    }

    return NextResponse.json({
      success: !allFailed,
      postId,
      published: Object.keys(published).length,
      failed: failures.length,
      failures,
    })
  } catch (err: unknown) {
    console.error('Publish error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
